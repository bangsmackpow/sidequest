export interface Env {
  // Bindings
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;

  // Secrets & Environment Variables
  SAM_GOV_API_KEY?: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL?: string;
  INBOUND_EMAIL_DOMAIN?: string;
  OUTBOUND_EMAIL_API_KEY?: string;
  OUTBOUND_EMAIL_FROM?: string;
  ENVIRONMENT?: "development" | "production" | "staging";
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
};

export type AuthSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  activeOrganizationId?: string | null;
};

export type AuthContext = {
  user: AuthUser;
  session: AuthSession;
  organizationId?: string | null;
  role?: "admin" | "manager" | "member";
};
