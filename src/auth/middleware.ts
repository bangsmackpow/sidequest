import { Context, Next, MiddlewareHandler } from "hono";
import { createAuth } from "./index";
import { createDb } from "../db";
import { members, organizations } from "../db/schema";
import { eq, and } from "drizzle-orm";
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

  // Check for test/development bypass header in non-production environments
  const devUserId = c.req.header("X-Dev-User-Id");
  if (devUserId && c.env.ENVIRONMENT !== "production") {
    const devRole = (c.req.header("X-Dev-Role") as "admin" | "manager" | "member") || "admin";
    const devOrg = c.req.header("X-Dev-Org-Id") || "org_demo_sdvosb";
    c.set("auth", {
      user: {
        id: devUserId,
        email: "dev@sdvosb-proposals.mil",
        name: "Dev SDVOSB Officer",
        emailVerified: true,
      },
      session: {
        id: "sess_dev_mock",
        userId: devUserId,
        expiresAt: new Date(Date.now() + 86400000),
        activeOrganizationId: devOrg,
      },
      organizationId: devOrg,
      role: devRole,
    });
    return next();
  }

  const auth = createAuth(c.env);

  try {
    const sessionResult = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!sessionResult || !sessionResult.session || !sessionResult.user) {
      return c.json(
        {
          error: "Unauthorized",
          message: "A valid session cookie or Bearer token is required to access this resource.",
        },
        401
      );
    }

    const userId = sessionResult.user.id;
    let orgId = (sessionResult.session as { activeOrganizationId?: string | null })
      .activeOrganizationId;

    // If no active org in session, resolve the first organization the user is a member of
    let userRole: "admin" | "manager" | "member" = "member";

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

    c.set("auth", {
      user: {
        id: sessionResult.user.id,
        email: sessionResult.user.email,
        name: sessionResult.user.name,
        emailVerified: sessionResult.user.emailVerified,
      },
      session: {
        id: sessionResult.session.id,
        userId: sessionResult.session.userId,
        expiresAt: sessionResult.session.expiresAt,
        activeOrganizationId: orgId,
      },
      organizationId: orgId ?? null,
      role: userRole,
    });

    return next();
  } catch (err: any) {
    console.error("Auth middleware error:", err);
    return c.json(
      {
        error: "Unauthorized",
        message: err.message || "Failed to validate authentication state.",
      },
      401
    );
  }
}

export function requireRole(allowedRoles: ("admin" | "manager" | "member")[]): MiddlewareHandler<{ Bindings: Env }> {
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
