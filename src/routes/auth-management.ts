import { Hono } from "hono";
import { Env } from "../types/env";
import { authMiddleware, requireRole } from "../auth/middleware";
import { createDb } from "../db";
import {
  users,
  accounts,
  sessions,
  members,
  twoFactors,
  verifications,
  organizations,
} from "../db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import {
  generateBase32Secret,
  verifyTotp,
  generateBackupCodes,
  getOtpAuthUri,
} from "../auth/totp";
import { OutboundEmailDispatcher } from "../workers/outbound-email";

export const authManagementRouter = new Hono<{ Bindings: Env }>();

// Public endpoints: Sign In and Sign Out
authManagementRouter.post("/sign-in", async (c) => {
  const db = c.get("db") || createDb(c.env.DB);
  const body = await c.req.json<{
    email?: string;
    password?: string;
    code?: string;
  }>();

  if (!body.email || !body.password) {
    return c.json({ error: "Email and password are required." }, 400);
  }

  const cleanEmail = body.email.trim().toLowerCase();
  const [userRec] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);

  if (!userRec) {
    return c.json({ error: "Invalid email or password." }, 401);
  }

  const [acc] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userRec.id), eq(accounts.providerId, "credential")))
    .limit(1);

  if (!acc || !acc.password) {
    return c.json({ error: "Invalid email or password." }, 401);
  }

  const isValidPassword = await verifyPassword({
    password: body.password,
    hash: acc.password,
  });

  if (!isValidPassword) {
    return c.json({ error: "Invalid email or password." }, 401);
  }

  // Check MFA if enabled on user record
  if (userRec.twoFactorEnabled) {
    if (!body.code) {
      return c.json({
        mfaRequired: true,
        message: "Two-Factor Authentication is active on this account. Please enter your 6-digit authenticator code.",
      }, 200);
    }

    const [tfRec] = await db.select().from(twoFactors).where(eq(twoFactors.userId, userRec.id)).limit(1);
    if (!tfRec || !tfRec.secret) {
      return c.json({ error: "MFA record missing. Contact platform administrator." }, 500);
    }

    let isCodeValid = await verifyTotp(tfRec.secret, body.code.trim());
    if (!isCodeValid && tfRec.backupCodes) {
      try {
        const backupList: string[] = JSON.parse(tfRec.backupCodes);
        const codeIndex = backupList.indexOf(body.code.trim());
        if (codeIndex !== -1) {
          isCodeValid = true;
          backupList.splice(codeIndex, 1);
          await db.update(twoFactors).set({ backupCodes: JSON.stringify(backupList) }).where(eq(twoFactors.id, tfRec.id));
        }
      } catch (e) {}
    }

    if (!isCodeValid) {
      return c.json({ error: "Invalid two-factor authentication code. Please check your app and try again." }, 400);
    }
  }

  // Generate new session token and record in sessions table
  const sessionToken = "st_" + crypto.randomUUID().replace(/-/g, "") + "_" + Date.now().toString(36);
  const sessionId = "sess_" + crypto.randomUUID().replace(/-/g, "");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const [memberRec] = await db.select().from(members).where(eq(members.userId, userRec.id)).limit(1);
  const activeOrgId = memberRec?.organizationId || "org_demo_sdvosb";

  await db.insert(sessions).values({
    id: sessionId,
    userId: userRec.id,
    token: sessionToken,
    expiresAt,
    activeOrganizationId: activeOrgId,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Set cookies
  c.header("Set-Cookie", `sidequest_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`, { append: true });
  c.header("Set-Cookie", `better-auth.session_token=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 86400}`, { append: true });

  return c.json({
    success: true,
    token: sessionToken,
    user: {
      id: userRec.id,
      name: userRec.name,
      email: userRec.email,
      role: memberRec?.role || userRec.role || "member",
      twoFactorEnabled: Boolean(userRec.twoFactorEnabled),
    },
    message: "Signed in successfully",
  });
});

authManagementRouter.post("/sign-out", async (c) => {
  const db = c.get("db") || createDb(c.env.DB);
  const authHeader = c.req.header("Authorization");
  const cookieHeader = c.req.header("Cookie") || "";
  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  } else {
    const match = cookieHeader.match(/(?:sidequest_session|better-auth\.session_token)=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  c.header("Set-Cookie", "sidequest_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0", { append: true });
  c.header("Set-Cookie", "better-auth.session_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0", { append: true });

  return c.json({ success: true, message: "Logged out successfully." });
});

// Apply authMiddleware to authenticated endpoints in authManagementRouter
authManagementRouter.use("/me", authMiddleware);
authManagementRouter.use("/mfa/*", authMiddleware);
authManagementRouter.use("/change-password", authMiddleware);

// ==========================================
// 1. Current Authenticated Profile & MFA Status
// ==========================================
authManagementRouter.get("/me", async (c) => {
  const auth = c.get("auth");
  const db = c.get("db");

  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const [dbUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, auth.user.id))
    .limit(1);

  const is2faActive = Boolean(dbUser?.twoFactorEnabled);
  const createdAtMs = dbUser?.createdAt ? new Date(dbUser.createdAt).getTime() : Date.now();
  const accountAgeMs = Date.now() - createdAtMs;
  const graceLimitMs = 3 * 24 * 60 * 60 * 1000;
  const remainingDays = Math.max(0, Math.ceil((graceLimitMs - accountAgeMs) / (24 * 60 * 60 * 1000)));
  const mfaEnforced = accountAgeMs > graceLimitMs && !is2faActive;

  return c.json({
    user: {
      id: auth.user.id,
      name: dbUser?.name || auth.user.name,
      email: dbUser?.email || auth.user.email,
      role: auth.role || dbUser?.role || "member",
      twoFactorEnabled: is2faActive,
      createdAt: dbUser?.createdAt || auth.user.createdAt,
    },
    organizationId: auth.organizationId,
    role: auth.role,
    mfa: {
      enabled: is2faActive,
      remainingDays,
      mfaEnforced,
      graceLimitDays: 3,
    },
  });
});

// ==========================================
// 2. MFA Setup, Verification & Disabling
// ==========================================

// Step 1: Generate TOTP Secret and QR URI
authManagementRouter.post("/mfa/generate", async (c) => {
  const auth = c.get("auth");
  const db = c.get("db");

  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const secret = generateBase32Secret(20);
  const backupCodes = generateBackupCodes(6);
  const otpAuthUri = getOtpAuthUri(auth.user.email, "Sidequest SDVOSB Capture", secret);

  // Store unverified secret in twoFactors table
  const twoFactorId = `tf_${auth.user.id}`;
  await db
    .insert(twoFactors)
    .values({
      id: twoFactorId,
      userId: auth.user.id,
      secret,
      backupCodes: JSON.stringify(backupCodes),
      verified: false,
    })
    .onConflictDoUpdate({
      target: twoFactors.id,
      set: {
        secret,
        backupCodes: JSON.stringify(backupCodes),
        verified: false,
      },
    });

  return c.json({
    secret,
    otpAuthUri,
    backupCodes,
    issuer: "Sidequest SDVOSB Capture",
    account: auth.user.email,
  });
});

// Step 2: Verify submitted 6-digit TOTP code and activate MFA
authManagementRouter.post("/mfa/enable", async (c) => {
  const auth = c.get("auth");
  const db = c.get("db");

  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<{ code: string }>();
  if (!body.code) {
    return c.json({ error: "6-digit verification code is required" }, 400);
  }

  const twoFactorId = `tf_${auth.user.id}`;
  const [record] = await db
    .select()
    .from(twoFactors)
    .where(eq(twoFactors.id, twoFactorId))
    .limit(1);

  if (!record || !record.secret) {
    return c.json({ error: "MFA setup has not been initiated. Please generate a QR secret first." }, 400);
  }

  const isValid = await verifyTotp(record.secret, body.code);
  if (!isValid) {
    return c.json(
      { error: "Invalid authenticator code. Ensure your device clock is accurate and try again." },
      400
    );
  }

  // Mark as verified and activate MFA on user record
  await db
    .update(twoFactors)
    .set({ verified: true })
    .where(eq(twoFactors.id, twoFactorId));

  await db
    .update(users)
    .set({
      twoFactorEnabled: true,
      updatedAt: new Date(),
    })
    .where(eq(users.id, auth.user.id));

  return c.json({
    success: true,
    message: "Two-Factor Authentication (MFA) successfully activated for your account!",
    twoFactorEnabled: true,
  });
});

// Step 3: Disable MFA (Requires Password Confirmation)
authManagementRouter.post("/mfa/disable", async (c) => {
  const auth = c.get("auth");
  const db = c.get("db");

  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<{ password?: string }>();
  if (!body.password) {
    return c.json({ error: "Account password is required to disable MFA" }, 400);
  }

  const [acc] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, auth.user.id), eq(accounts.providerId, "credential")))
    .limit(1);

  if (acc && acc.password) {
    const isPassValid = await verifyPassword({
      password: body.password,
      hash: acc.password,
    });
    if (!isPassValid) {
      return c.json({ error: "Incorrect password. MFA was not disabled." }, 400);
    }
  }

  await db
    .update(users)
    .set({
      twoFactorEnabled: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, auth.user.id));

  const twoFactorId = `tf_${auth.user.id}`;
  await db.delete(twoFactors).where(eq(twoFactors.id, twoFactorId));

  return c.json({
    success: true,
    message: "Two-Factor Authentication has been disabled.",
    twoFactorEnabled: false,
  });
});

// ==========================================
// 3. Password Management: Change & Forgot/Reset
// ==========================================

// Change password for logged-in user
authManagementRouter.post("/change-password", async (c) => {
  const auth = c.get("auth");
  const db = c.get("db");

  if (!auth) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const body = await c.req.json<{ currentPassword?: string; newPassword?: string }>();
  if (!body.currentPassword || !body.newPassword) {
    return c.json({ error: "Both currentPassword and newPassword are required" }, 400);
  }

  if (body.newPassword.length < 8) {
    return c.json({ error: "New password must be at least 8 characters long" }, 400);
  }

  const [acc] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, auth.user.id), eq(accounts.providerId, "credential")))
    .limit(1);

  if (acc && acc.password) {
    const isOldValid = await verifyPassword({
      password: body.currentPassword,
      hash: acc.password,
    });
    if (!isOldValid) {
      return c.json({ error: "Current password does not match" }, 400);
    }
  }

  const newHash = await hashPassword(body.newPassword);

  if (acc) {
    await db
      .update(accounts)
      .set({
        password: newHash,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, acc.id));
  } else {
    await db.insert(accounts).values({
      id: `acc_${auth.user.id}`,
      userId: auth.user.id,
      accountId: auth.user.email,
      providerId: "credential",
      password: newHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return c.json({
    success: true,
    message: "Password changed successfully!",
  });
});

// Public: Forgot Password Request (Generates Reset Token & Dispatches Email)
authManagementRouter.post("/forgot-password", async (c) => {
  const db = c.get("db");
  const body = await c.req.json<{ email: string }>();

  if (!body.email) {
    return c.json({ error: "Email address is required" }, 400);
  }

  const cleanEmail = body.email.trim().toLowerCase();
  const [userRec] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (!userRec) {
    // Return generic success to prevent email enumeration
    return c.json({
      success: true,
      message: "If that email is registered, a password reset link has been dispatched.",
    });
  }

  // Generate 32-byte hex reset token
  const tokenBytes = new Uint8Array(24);
  crypto.getRandomValues(tokenBytes);
  const token = Array.from(tokenBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

  const verificationId = `reset_${cleanEmail}`;
  await db
    .insert(verifications)
    .values({
      id: verificationId,
      identifier: `reset-password:${cleanEmail}`,
      value: token,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: verifications.id,
      set: {
        value: token,
        expiresAt,
        updatedAt: new Date(),
      },
    });

  const origin = c.req.header("origin") || c.env.BETTER_AUTH_URL || "https://sidequest.curtislamasters.workers.dev";
  const resetUrl = `${origin}/?reset_token=${token}&email=${encodeURIComponent(cleanEmail)}`;

  // Dispatch email notification
  const dispatcher = new OutboundEmailDispatcher(c.env);
  await dispatcher.send({
    to: cleanEmail,
    subject: "SDVOSB Platform: Password Reset Verification",
    text: `Hello ${userRec.name},\n\nA password reset was requested for your account.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please disregard this email.`,
  });

  return c.json({
    success: true,
    message: "If that email is registered, a password reset link has been dispatched.",
    resetToken: token, // Provided for convenience in dev/testing
  });
});

// Public: Reset Password with Token
authManagementRouter.post("/reset-password", async (c) => {
  const db = c.get("db");
  const body = await c.req.json<{
    email: string;
    token: string;
    newPassword: string;
  }>();

  if (!body.email || !body.token || !body.newPassword) {
    return c.json({ error: "email, token, and newPassword are required" }, 400);
  }

  if (body.newPassword.length < 8) {
    return c.json({ error: "Password must be at least 8 characters long" }, 400);
  }

  const cleanEmail = body.email.trim().toLowerCase();
  const verificationId = `reset_${cleanEmail}`;

  const [verification] = await db
    .select()
    .from(verifications)
    .where(eq(verifications.id, verificationId))
    .limit(1);

  if (!verification || verification.value !== body.token.trim()) {
    return c.json({ error: "Invalid or expired password reset token." }, 400);
  }

  if (new Date(verification.expiresAt).getTime() < Date.now()) {
    return c.json({ error: "This password reset token has expired. Please request a new one." }, 400);
  }

  const [userRec] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (!userRec) {
    return c.json({ error: "User account not found." }, 404);
  }

  const newHash = await hashPassword(body.newPassword);

  const [acc] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userRec.id), eq(accounts.providerId, "credential")))
    .limit(1);

  if (acc) {
    await db
      .update(accounts)
      .set({
        password: newHash,
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, acc.id));
  } else {
    await db.insert(accounts).values({
      id: `acc_${userRec.id}`,
      userId: userRec.id,
      accountId: cleanEmail,
      providerId: "credential",
      password: newHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Delete used verification token
  await db.delete(verifications).where(eq(verifications.id, verificationId));

  return c.json({
    success: true,
    message: "Your password has been successfully reset. You may now sign in.",
  });
});

// ==========================================
// 4. Admin Console: Complete User Management (Create, Edit, Delete, Reset Password, Reset MFA)
// ==========================================

export const adminUserRouter = new Hono<{ Bindings: Env }>();

// Guard all admin routes with authMiddleware and requireRole(["admin"])
adminUserRouter.use("*", authMiddleware);
adminUserRouter.use("*", requireRole(["admin"]));

// List all users with account age, role, and MFA compliance status
adminUserRouter.get("/", async (c) => {
  const db = c.get("db");

  const userList = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      twoFactorEnabled: users.twoFactorEnabled,
      role: users.role,
      banned: users.banned,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const enrichedUsers = await Promise.all(
    userList.map(async (u) => {
      // Find org role
      const [memberRec] = await db
        .select({ role: members.role })
        .from(members)
        .where(eq(members.userId, u.id))
        .limit(1);

      const effectiveRole = memberRec?.role || u.role || "member";

      // Calculate MFA compliance status
      const createdAtMs = u.createdAt ? new Date(u.createdAt).getTime() : Date.now();
      const accountAgeMs = Date.now() - createdAtMs;
      const graceLimitMs = 3 * 24 * 60 * 60 * 1000;
      const remainingDays = Math.max(0, Math.ceil((graceLimitMs - accountAgeMs) / (24 * 60 * 60 * 1000)));

      let mfaStatus: "active" | "grace_period" | "enforced_expired" = "active";
      if (!u.twoFactorEnabled) {
        mfaStatus = accountAgeMs > graceLimitMs ? "enforced_expired" : "grace_period";
      }

      return {
        ...u,
        role: effectiveRole,
        mfaStatus,
        remainingGraceDays: remainingDays,
      };
    })
  );

  return c.json({ users: enrichedUsers });
});

// Admin Create User
adminUserRouter.post("/", async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");
  const body = await c.req.json<{
    name: string;
    email: string;
    role: "admin" | "manager" | "member";
    password?: string;
  }>();

  if (!body.name || !body.email) {
    return c.json({ error: "Name and email are required" }, 400);
  }

  const cleanEmail = body.email.trim().toLowerCase();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, cleanEmail))
    .limit(1);

  if (existing) {
    return c.json({ error: "A user with this email address already exists." }, 400);
  }

  const initialPassword = body.password || "SidequestSDVOSB!2026";
  const passwordHash = await hashPassword(initialPassword);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const orgId = auth?.organizationId || "org_demo_sdvosb";

  await db.insert(users).values({
    id: userId,
    name: body.name.trim(),
    email: cleanEmail,
    emailVerified: true,
    twoFactorEnabled: false,
    role: body.role || "member",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(accounts).values({
    id: `acc_${userId}`,
    userId,
    accountId: cleanEmail,
    providerId: "credential",
    password: passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(members).values({
    id: `mem_${userId}`,
    organizationId: orgId,
    userId,
    role: body.role || "member",
    createdAt: new Date(),
  });

  return c.json({
    success: true,
    message: `User created successfully! Temporary password: ${initialPassword}`,
    user: {
      id: userId,
      name: body.name,
      email: cleanEmail,
      role: body.role || "member",
      initialPassword,
    },
  });
});

// Admin Update User (Name, Email, Role)
adminUserRouter.patch("/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const body = await c.req.json<{
    name?: string;
    email?: string;
    role?: "admin" | "manager" | "member";
  }>();

  const [userRec] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!userRec) {
    return c.json({ error: "User not found" }, 404);
  }

  const updates: Record<string, any> = { updatedAt: new Date() };

  if (body.name !== undefined) {
    const trimmedName = body.name.trim();
    if (!trimmedName) {
      return c.json({ error: "User name cannot be empty." }, 400);
    }
    updates.name = trimmedName;
  }

  if (body.email !== undefined) {
    const cleanEmail = body.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return c.json({ error: "Invalid email address format." }, 400);
    }

    if (cleanEmail !== userRec.email.toLowerCase()) {
      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);

      if (existing && existing.id !== id) {
        return c.json({ error: "A user with this email address already exists." }, 400);
      }

      updates.email = cleanEmail;

      // Also update the account credential record so the user can sign in with new email
      await db
        .update(accounts)
        .set({ accountId: cleanEmail, updatedAt: new Date() })
        .where(and(eq(accounts.userId, id), eq(accounts.providerId, "credential")));
    }
  }

  if (body.role !== undefined) {
    updates.role = body.role;
    await db
      .update(members)
      .set({ role: body.role })
      .where(eq(members.userId, id));
  }

  await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id));

  const [updatedUser] = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return c.json({
    success: true,
    message: "User updated successfully.",
    user: updatedUser,
  });
});

// Admin Reset Password for a user
adminUserRouter.post("/:id/reset-password", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const body = await c.req.json<{ newPassword?: string }>();

  const [userRec] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!userRec) {
    return c.json({ error: "User not found" }, 404);
  }

  const generatedPassword = body.newPassword || `SDVOSB-${Math.random().toString(36).substring(2, 6).toUpperCase()}!2026`;
  const passwordHash = await hashPassword(generatedPassword);

  const [acc] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, id), eq(accounts.providerId, "credential")))
    .limit(1);

  if (acc) {
    await db
      .update(accounts)
      .set({ password: passwordHash, updatedAt: new Date() })
      .where(eq(accounts.id, acc.id));
  } else {
    await db.insert(accounts).values({
      id: `acc_${id}`,
      userId: id,
      accountId: userRec.email,
      providerId: "credential",
      password: passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  return c.json({
    success: true,
    message: `Password has been reset for ${userRec.email}.`,
    temporaryPassword: generatedPassword,
  });
});

// Admin Reset MFA for locked-out user
adminUserRouter.post("/:id/reset-mfa", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  await db
    .update(users)
    .set({ twoFactorEnabled: false, updatedAt: new Date() })
    .where(eq(users.id, id));

  const twoFactorId = `tf_${id}`;
  await db.delete(twoFactors).where(eq(twoFactors.id, twoFactorId));

  return c.json({
    success: true,
    message: "User MFA has been reset. The user can now re-enroll their authenticator device.",
  });
});

// Admin Delete User
adminUserRouter.delete("/:id", async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");
  const id = c.req.param("id");

  if (auth && auth.user.id === id) {
    return c.json({ error: "You cannot delete your own administrative account." }, 400);
  }

  await db.delete(members).where(eq(members.userId, id));
  await db.delete(accounts).where(eq(accounts.userId, id));
  await db.delete(sessions).where(eq(sessions.userId, id));
  await db.delete(twoFactors).where(eq(twoFactors.userId, id));
  await db.delete(users).where(eq(users.id, id));

  return c.json({ success: true, message: "User deleted successfully." });
});
