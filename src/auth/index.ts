import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, bearer } from "better-auth/plugins";
import * as schema from "../db/schema";
import { createDb } from "../db";
import { Env } from "../types/env";

export function createAuth(env: Env) {
  const db = createDb(env.DB);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
        organization: schema.organizations,
        member: schema.members,
        invitation: schema.invitations,
      },
      usePlural: true,
    }),
    secret: env.BETTER_AUTH_SECRET || "default_sdvosb_secret_change_in_production",
    baseURL: env.BETTER_AUTH_URL || "http://localhost:8787",
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
      }),
      bearer(),
    ],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    user: {
      additionalFields: {},
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
