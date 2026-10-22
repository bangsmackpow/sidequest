import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// ==========================================
// 1. Better Auth Multi-Tenant Schema (with 2FA & Admin support)
// ==========================================

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
  role: text("role").default("user"),
  banned: integer("banned", { mode: "boolean" }).default(false),
  banReason: text("ban_reason"),
  banExpires: integer("ban_expires", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  activeOrganizationId: text("active_organization_id"),
  impersonatedBy: text("impersonated_by"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const verifications = sqliteTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const twoFactors = sqliteTable("two_factors", {
  id: text("id").primaryKey(),
  secret: text("secret").notNull(),
  backupCodes: text("backup_codes").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  failedVerificationCount: integer("failed_verification_count").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  metadata: text("metadata"),
});

export const members = sqliteTable("members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // Custom role: admin, manager, member
  role: text("role").notNull().default("member"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const invitations = sqliteTable("invitations", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role").notNull().default("member"),
  status: text("status").notNull().default("pending"),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

// ==========================================
// 2. Saved Search Profiles
// ==========================================

export const savedSearchProfiles = sqliteTable("saved_search_profiles", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  naicsCodes: text("naics_codes").notNull().default("[]"), // JSON string array, e.g. ["541512", "541519"]
  setAsides: text("set_asides").notNull().default('["SDVOSBC"]'), // JSON array, e.g. ["SDVOSBC", "VOSBC"]
  noticeTypes: text("notice_types").notNull().default('["r","o"]'), // JSON array: r=Sources Sought, o=Solicitation, k=Combined Synopsis
  pscCodes: text("psc_codes").notNull().default("[]"), // JSON array
  minValue: integer("min_value"),
  maxValue: integer("max_value"), // e.g. 250000 for Simplified Acquisition Threshold
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ==========================================
// 3. Opportunities
// ==========================================

export const opportunities = sqliteTable("opportunities", {
  id: text("id").primaryKey(), // maps to SAM.gov noticeId
  solicitationNumber: text("solicitation_number"),
  title: text("title").notNull(),
  agency: text("agency"),
  subTier: text("sub_tier"),
  office: text("office"),
  postedDate: text("posted_date"),
  responseDeadline: text("response_deadline"),
  naicsCode: text("naics_code"),
  setAsideCode: text("set_aside_code"),
  noticeType: text("notice_type"),
  uiLink: text("ui_link"),
  pointOfContactEmail: text("point_of_contact_email"),
  rawJsonR2Key: text("raw_json_r2_key"),
  // Pipeline status: new, reviewing_sow, drafting_rfi, submitted, won, lost, archived
  status: text("status").notNull().default("new"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ==========================================
// 4. Opportunity Attachments
// ==========================================

export const opportunityAttachments = sqliteTable("opportunity_attachments", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  r2Key: text("r2_key").notNull(),
  contentType: text("content_type"),
  parsedText: text("parsed_text"), // Extracted text for search/RAG
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ==========================================
// 5. Capability Statements
// ==========================================

export const capabilityStatements = sqliteTable("capability_statements", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  coreCompetencies: text("core_competencies").notNull(), // Markdown or JSON
  pastPerformance: text("past_performance").notNull(), // Markdown or JSON
  dunsUei: text("duns_uei").notNull(),
  cageCode: text("cage_code").notNull(),
  sdvosbCertified: integer("sdvosb_certified", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ==========================================
// 6. Opportunity Notes & Inbound Email Logs
// ==========================================

export const opportunityNotes = sqliteTable("opportunity_notes", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  authorEmail: text("author_email").notNull(),
  subject: text("subject"),
  content: text("content").notNull(),
  source: text("source").notNull().default("email"), // 'email' | 'user' | 'system_alert'
  r2EmailPrefix: text("r2_email_prefix"), // Links to R2 archive folder emails/{opp_id}/{msg_id}
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

// ==========================================
// 7. Opportunity Alerts & Audit Trail
// ==========================================

export const opportunityAlerts = sqliteTable("opportunity_alerts", {
  id: text("id").primaryKey(),
  opportunityId: text("opportunity_id")
    .notNull()
    .references(() => opportunities.id, { onDelete: "cascade" }),
  profileId: text("profile_id").references(() => savedSearchProfiles.id, {
    onDelete: "set null",
  }),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  matchedCriteria: text("matched_criteria").notNull(), // JSON string summary
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});
