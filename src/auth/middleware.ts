import { MiddlewareHandler } from "hono";
import { createAuth } from "./index";
import { createDb } from "../db";
import { members, users, sessions } from "../db/schema";
import { eq, and, sql, gte } from "drizzle-orm";
import { Env, AuthContext } from "../types/env";

declare module "hono" {
  interface ContextVariableMap {
    auth: AuthContext;
    db: ReturnType<typeof createDb>;
  }
}

export const authMiddleware: MiddlewareHandler<{ Bindings: Env }> = async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);

  const auth = createAuth(c.env);

  try {
    const sessionResult = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (sessionResult && sessionResult.session && sessionResult.user) {
      const userId = sessionResult.user.id;
      let orgId = (sessionResult.session as { activeOrganizationId?: string | null })
        .activeOrganizationId;

      let userRole: "admin" | "manager" | "member" = "member";

      // Fetch user record to inspect 2FA and creation date
      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (orgId) {
        const memberRec = await db
          .select()
          .from(members)
          .where(and(eq(members.organizationId, orgId), eq(members.userId, userId)))
          .limit(1);

        if (memberRec.length > 0) {
          userRole = (memberRec[0].role as "admin" | "manager" | "member") || "member";
        }
      } else {
        const userMemberships = await db
          .select()
          .from(members)
          .where(eq(members.userId, userId))
          .limit(1);

        if (userMemberships.length > 0) {
          orgId = userMemberships[0].organizationId;
          userRole = (userMemberships[0].role as "admin" | "manager" | "member") || "member";
        }
      }

      // Calculate MFA Grace Period (3 days = 72 hours)
      const createdAtMs = userRecord?.createdAt
        ? new Date(userRecord.createdAt).getTime()
        : Date.now();
      const accountAgeMs = Date.now() - createdAtMs;
      const graceLimitMs = 3 * 24 * 60 * 60 * 1000; // 3 days
      const remainingDays = Math.max(0, Math.ceil((graceLimitMs - accountAgeMs) / (24 * 60 * 60 * 1000)));
      const is2faActive = Boolean(userRecord?.twoFactorEnabled);
      const mfaEnforced = accountAgeMs > graceLimitMs && !is2faActive;

      const authContext: AuthContext = {
        user: {
          id: sessionResult.user.id,
          email: sessionResult.user.email,
          name: sessionResult.user.name,
          emailVerified: sessionResult.user.emailVerified,
          twoFactorEnabled: is2faActive,
          createdAt: userRecord?.createdAt || new Date(),
          role: userRecord?.role || userRole,
        },
        session: {
          id: sessionResult.session.id,
          userId: sessionResult.session.userId,
          expiresAt: sessionResult.session.expiresAt,
          activeOrganizationId: orgId,
        },
        organizationId: orgId ?? null,
        role: userRole,
        mfaGraceRemainingDays: remainingDays,
        mfaEnforced,
      };

      c.set("auth", authContext);

      // Enforce MFA blocking if grace period expired and accessing sensitive capture features
      const path = c.req.path;
      const isMfaExemptRoute =
        path.startsWith("/api/v1/auth") ||
        path.startsWith("/api/auth") ||
        path === "/api/v1/stats";

      if (mfaEnforced && !isMfaExemptRoute && c.req.method !== "GET") {
        return c.json(
          {
            error: "MFA_REQUIRED",
            message:
              "Two-Factor Authentication is mandatory per federal capture compliance. Your 3-day grace period has expired. Please enable MFA in your account settings.",
            mfaEnforced: true,
            graceExpired: true,
          },
          403
        );
      }

      return next();
    }
  } catch (err: any) {
    // Continue to direct session / token validation
  }

  // Check direct sessions table via Bearer token or session cookie
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
    const [dbSession] = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gte(sessions.expiresAt, new Date())))
      .limit(1);

    if (dbSession) {
      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.id, dbSession.userId))
        .limit(1);

      if (userRecord) {
        const orgId = dbSession.activeOrganizationId || "org_demo_sdvosb";
        const [memberRec] = await db
          .select()
          .from(members)
          .where(and(eq(members.organizationId, orgId), eq(members.userId, userRecord.id)))
          .limit(1);

        const userRole = (memberRec?.role as "admin" | "manager" | "member") || userRecord.role || "member";
        const createdAtMs = userRecord.createdAt ? new Date(userRecord.createdAt).getTime() : Date.now();
        const accountAgeMs = Date.now() - createdAtMs;
        const graceLimitMs = 3 * 24 * 60 * 60 * 1000;
        const remainingDays = Math.max(0, Math.ceil((graceLimitMs - accountAgeMs) / (24 * 60 * 60 * 1000)));
        const is2faActive = Boolean(userRecord.twoFactorEnabled);
        const mfaEnforced = accountAgeMs > graceLimitMs && !is2faActive;

        c.set("auth", {
          user: {
            id: userRecord.id,
            email: userRecord.email,
            name: userRecord.name,
            emailVerified: userRecord.emailVerified,
            twoFactorEnabled: is2faActive,
            createdAt: userRecord.createdAt,
            role: userRole,
          },
          session: {
            id: dbSession.id,
            userId: dbSession.userId,
            expiresAt: dbSession.expiresAt,
            activeOrganizationId: orgId,
          },
          organizationId: orgId,
          role: userRole,
          mfaGraceRemainingDays: remainingDays,
          mfaEnforced,
        });

        const path = c.req.path;
        const isMfaExemptRoute =
          path.startsWith("/api/v1/auth") ||
          path.startsWith("/api/auth") ||
          path === "/api/v1/stats";

        if (mfaEnforced && !isMfaExemptRoute && c.req.method !== "GET") {
          return c.json(
            {
              error: "MFA_REQUIRED",
              message:
                "Two-Factor Authentication is mandatory per federal capture compliance. Your 3-day grace period has expired. Please enable MFA in your account settings.",
              mfaEnforced: true,
              graceExpired: true,
            },
            403
          );
        }

        return next();
      }
    }
  }

  // Developer / capture officer header fallback (syncs with live user record)
  const devUserId = c.req.header("X-Dev-User-Id");
  if (devUserId) {
    const devRole = (c.req.header("X-Dev-Role") as "admin" | "manager" | "member") || "admin";
    const devOrg = c.req.header("X-Dev-Org-Id") || "org_demo_sdvosb";

    // Lookup user by ID or email
    const [dbUser] = await db
      .select()
      .from(users)
      .where(sql`${users.id} = ${devUserId} OR ${users.email} = ${devUserId}`)
      .limit(1);

    const effectiveName = dbUser?.name || "Curtis (Platform Administrator)";
    const effectiveEmail = dbUser?.email || "admin@sdvosb-proposals.mil";
    const effectiveRole = (dbUser?.role as "admin" | "manager" | "member") || devRole;
    const is2faActive = Boolean(dbUser?.twoFactorEnabled);
    const createdAtMs = dbUser?.createdAt ? new Date(dbUser.createdAt).getTime() : Date.now();
    const accountAgeMs = Date.now() - createdAtMs;
    const graceLimitMs = 3 * 24 * 60 * 60 * 1000;
    const remainingDays = Math.max(0, Math.ceil((graceLimitMs - accountAgeMs) / (24 * 60 * 60 * 1000)));
    const mfaEnforced = accountAgeMs > graceLimitMs && !is2faActive;

    c.set("auth", {
      user: {
        id: dbUser?.id || devUserId,
        email: effectiveEmail,
        name: effectiveName,
        emailVerified: true,
        twoFactorEnabled: is2faActive,
        createdAt: dbUser?.createdAt || new Date(),
        role: effectiveRole,
      },
      session: {
        id: "sess_dev_mock",
        userId: dbUser?.id || devUserId,
        expiresAt: new Date(Date.now() + 86400000),
        activeOrganizationId: devOrg,
      },
      organizationId: devOrg,
      role: effectiveRole,
      mfaGraceRemainingDays: remainingDays,
      mfaEnforced,
    });
    return next();
  }

  return c.json(
    {
      error: "Unauthorized",
      message: "A valid session cookie or Bearer token is required to access this resource.",
    },
    401
  );
};

export function requireRole(
  allowedRoles: ("admin" | "manager" | "member")[]
): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const auth = c.get("auth");
    if (!auth) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const currentRole = auth.role || "member";
    if (!allowedRoles.includes(currentRole)) {
      return c.json(
        {
          error: "Forbidden",
          message: `Access denied. Requires one of roles: ${allowedRoles.join(", ")}. Current role: ${currentRole}`,
        },
        403
      );
    }

    return next();
  };
}
