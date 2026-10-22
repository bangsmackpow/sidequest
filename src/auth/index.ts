import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, bearer, twoFactor, admin } from "better-auth/plugins";
import * as schema from "../db/schema";
import { createDb } from "../db";
import { Env } from "../types/env";
import { OutboundEmailDispatcher } from "../workers/outbound-email";

export function createAuth(env: Env) {
  const db = createDb(env.DB);
  const emailDispatcher = new OutboundEmailDispatcher(env);

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        users: schema.users,
        sessions: schema.sessions,
        accounts: schema.accounts,
        verifications: schema.verifications,
        organizations: schema.organizations,
        members: schema.members,
        invitations: schema.invitations,
        twoFactors: schema.twoFactors,
        twoFactor: schema.twoFactors,
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
    baseURL: env.BETTER_AUTH_URL || "https://sidequest.curtislamasters.workers.dev",
    plugins: [
      organization({
        allowUserToCreateOrganization: true,
      }),
      bearer(),
      twoFactor({
        issuer: "Sidequest SDVOSB Capture",
      }),
      admin(),
    ],
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      async sendResetPassword(data) {
        console.log(`[Password Reset] Dispatched link for ${data.user.email}: ${data.url}`);
        await emailDispatcher.send({
          to: data.user.email,
          subject: "SDVOSB Platform: Password Reset Verification Request",
          text: `Hello ${data.user.name || "User"},\n\nA password reset was requested for your SDVOSB Capture platform account.\n\nReset your password here:\n${data.url}\n\nIf you did not request this, please contact your capture administrator immediately.`,
        });
      },
    },
    user: {
      additionalFields: {
        twoFactorEnabled: {
          type: "boolean",
          defaultValue: false,
        },
      },
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
