import { Hono } from "hono";
import { Env } from "../types/env";
import { authMiddleware, requireRole } from "../auth/middleware";
import {
  opportunities,
  opportunityAttachments,
  opportunityNotes,
  opportunityAlerts,
  capabilityStatements,
  savedSearchProfiles,
  users,
} from "../db/schema";
import { eq, and, like, desc, sql, gte, lte } from "drizzle-orm";
import { StorageService } from "../services/storage";
import { RfiGenerator, ProposalTemplateType } from "../services/rfi-generator";
import {
  calculateLimitationsOnSubcontracting,
  checkNonManufacturerRule,
  fetchHistoricalAwardIntelligence,
  ProcurementCategory,
} from "../services/compliance-and-intel";
import { runSamIngestion } from "../workers/ingest";
import { parseSamAgencyHierarchy, PRIORITY_NAICS_LIST, PRIORITY_NAICS_CODES } from "../services/sam-api";
import { handleInboundEmail } from "../workers/email";
import { OutboundEmailDispatcher } from "../workers/outbound-email";
import { seedDatabase } from "../db/seed";
import { authManagementRouter, adminUserRouter } from "./auth-management";

export const apiRouter = new Hono<{ Bindings: Env }>();

// Mount Auth Profile, MFA, & Password Reset endpoints
apiRouter.route("/auth", authManagementRouter);

// Mount Admin User Management Console endpoints
apiRouter.route("/admin/users", adminUserRouter);

// All remaining routes under /api/v1/* are protected via authMiddleware
apiRouter.use("*", authMiddleware);

// ==========================================
// 1. Dashboard Statistics
// ==========================================
apiRouter.get("/stats", async (c) => {
  const db = c.get("db");

  const [totalCount] = await db.select({ count: sql<number>`count(*)` }).from(opportunities);
  const [newCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities)
    .where(eq(opportunities.status, "new"));
  const [reviewingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities)
    .where(
      sql`${opportunities.status} IN ('reviewing_sow', 'analyzing')`
    );
  const [draftingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities)
    .where(
      sql`${opportunities.status} IN ('drafting_rfi', 'pursuing')`
    );
  const [submittedCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities)
    .where(eq(opportunities.status, "submitted"));
  const [wonCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities)
    .where(eq(opportunities.status, "won"));
  const [alertsCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunityAlerts);

  const lastSync = await c.env.KV.get("sam_last_sync_timestamp");

  return c.json({
    totalOpportunities: totalCount?.count || 0,
    newOpportunities: newCount?.count || 0,
    reviewingOpportunities: reviewingCount?.count || 0,
    activeProposals: draftingCount?.count || 0,
    submittedProposals: submittedCount?.count || 0,
    wonContracts: wonCount?.count || 0,
    totalAlerts: alertsCount?.count || 0,
    lastSamSync: lastSync || null,
  });
});

// ==========================================
// 2. Opportunities Endpoints
// ==========================================

// GET /api/v1/opportunities (Filterable by NAICS, set-aside, notice_type, status, deadline, query, SAT, rule_of_two)
apiRouter.get("/opportunities", async (c) => {
  const db = c.get("db");
  const naics = c.req.query("naics");
  const setAside = c.req.query("set_aside");
  const noticeType = c.req.query("notice_type");
  const status = c.req.query("status");
  const deadlineBefore = c.req.query("deadline_before");
  const deadlineAfter = c.req.query("deadline_after");
  const isSat = c.req.query("is_sat") === "true";
  const isRuleOfTwo = c.req.query("rule_of_two") === "true";
  const query = c.req.query("q");
  const limit = Math.min(parseInt(c.req.query("limit") || "50", 10), 200);
  const offset = parseInt(c.req.query("offset") || "0", 10);

  const conditions = [];

  if (naics) {
    conditions.push(like(opportunities.naicsCode, `%${naics}%`));
  }
  if (setAside) {
    conditions.push(eq(opportunities.setAsideCode, setAside));
  }
  if (noticeType) {
    conditions.push(eq(opportunities.noticeType, noticeType));
  }
  if (status) {
    conditions.push(eq(opportunities.status, status));
  }
  if (deadlineBefore) {
    conditions.push(lte(opportunities.responseDeadline, deadlineBefore));
  }
  if (deadlineAfter) {
    conditions.push(gte(opportunities.responseDeadline, deadlineAfter));
  }
  if (isSat) {
    conditions.push(
      sql`(${opportunities.title} LIKE '%Simplified Acquisition%' OR ${opportunities.title} LIKE '%SAT%' OR ${opportunities.solicitationNumber} LIKE '%Q%' OR ${opportunities.noticeType} = 'k')`
    );
  }
  if (isRuleOfTwo) {
    conditions.push(
      sql`(${opportunities.noticeType} = 'r' AND ${opportunities.setAsideCode} NOT IN ('SDVOSBC', 'SDVOSBS'))`
    );
  }
  if (query) {
    conditions.push(
      sql`(${opportunities.title} LIKE ${`%${query}%`} OR ${opportunities.solicitationNumber} LIKE ${`%${query}%`} OR ${opportunities.agency} LIKE ${`%${query}%`} OR ${opportunities.office} LIKE ${`%${query}%`})`
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(opportunities)
    .where(whereClause)
    .orderBy(desc(opportunities.postedDate))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities)
    .where(whereClause);

  return c.json({
    data: rows,
    total: countResult?.count || 0,
    limit,
    offset,
  });
});

// GET /api/v1/opportunities/:id (Full details, attachments, notes, alerts)
apiRouter.get("/opportunities/:id", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const [opp] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!opp) {
    return c.json({ error: "Opportunity not found" }, 404);
  }

  const attachments = await db
    .select()
    .from(opportunityAttachments)
    .where(eq(opportunityAttachments.opportunityId, id));

  const notes = await db
    .select()
    .from(opportunityNotes)
    .where(eq(opportunityNotes.opportunityId, id))
    .orderBy(desc(opportunityNotes.createdAt));

  const alerts = await db
    .select()
    .from(opportunityAlerts)
    .where(eq(opportunityAlerts.opportunityId, id))
    .orderBy(desc(opportunityAlerts.createdAt));

  return c.json({
    opportunity: opp,
    attachments,
    notes,
    alerts,
  });
});

// PATCH /api/v1/opportunities/:id/status (Transition status)
apiRouter.patch("/opportunities/:id/status", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const body = await c.req.json<{ status: string; reason?: string }>();

  if (!body.status) {
    return c.json({ error: "status is required" }, 400);
  }

  const validStatuses = [
    "new",
    "reviewing_sow",
    "analyzing",
    "drafting_rfi",
    "pursuing",
    "submitted",
    "won",
    "lost",
    "archived",
  ];

  if (!validStatuses.includes(body.status.toLowerCase())) {
    return c.json(
      {
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      },
      400
    );
  }

  const cleanStatus = body.status.toLowerCase();

  const [existing] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Opportunity not found" }, 404);
  }

  await db
    .update(opportunities)
    .set({
      status: cleanStatus,
      updatedAt: sql`(datetime('now'))`,
    })
    .where(eq(opportunities.id, id));

  // Log status change into notes
  const auth = c.get("auth");
  const author = auth?.user?.email || "capture-manager@sdvosb-proposals.mil";
  await db.insert(opportunityNotes).values({
    id: crypto.randomUUID(),
    opportunityId: id,
    organizationId: auth?.organizationId || null,
    authorEmail: author,
    subject: `Status Transition: ${existing.status} ➔ ${cleanStatus}`,
    content: body.reason ? `Reason: ${body.reason}` : `Opportunity status updated to "${cleanStatus}" by ${author}.`,
    source: "user",
  });

  return c.json({
    success: true,
    id,
    previousStatus: existing.status,
    newStatus: cleanStatus,
  });
});

// POST /api/v1/opportunities/:id/generate-rfi (Generate Section L SDVOSB response & store in R2)
apiRouter.post("/opportunities/:id/generate-rfi", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const auth = c.get("auth");
  const body = await c.req.json<{
    capabilityStatementId?: string;
    templateType?: ProposalTemplateType;
    companyName?: string;
    uei?: string;
    cageCode?: string;
    sdvosbCertified?: boolean;
    coreCompetencies?: string;
    pastPerformance?: string;
    pocName?: string;
    pocEmail?: string;
    pocPhone?: string;
    customApproach?: string;
    subcontractingPlan?: string;
    proposedPrice?: number;
    deliveryTimelineDays?: number;
  }>();

  const [opp] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!opp) {
    return c.json({ error: "Opportunity not found" }, 404);
  }

  // Load organization capability statement if available
  let capStmt: any = null;
  if (body.capabilityStatementId) {
    const [found] = await db
      .select()
      .from(capabilityStatements)
      .where(eq(capabilityStatements.id, body.capabilityStatementId))
      .limit(1);
    capStmt = found;
  } else if (auth?.organizationId) {
    const [found] = await db
      .select()
      .from(capabilityStatements)
      .where(eq(capabilityStatements.organizationId, auth.organizationId))
      .limit(1);
    capStmt = found;
  }

  const companyName = body.companyName || "VALIANT VETERAN DEFENSE TECHNOLOGIES LLC";
  const uei = body.uei || capStmt?.dunsUei || "VET876543210";
  const cageCode = body.cageCode || capStmt?.cageCode || "9ABC4";
  const sdvosbCertified = body.sdvosbCertified !== undefined ? body.sdvosbCertified : capStmt ? capStmt.sdvosbCertified : true;

  const coreCompetencies =
    body.coreCompetencies ||
    capStmt?.coreCompetencies ||
    `- **Enterprise Cloud Architecture:** Migration, Zero Trust, and FedRAMP Moderate/High compliance.
- **Cybersecurity & Continuous Monitoring:** NIST SP 800-171, CMMC Level 2, and SIEM engineering.
- **Agile Systems Integration:** Microservices, automated CI/CD pipelines, and Federal Data Analytics.`;

  const pastPerformance =
    body.pastPerformance ||
    capStmt?.pastPerformance ||
    `### Contract Reference 1: Defense Health Enterprise DevSecOps
- **Client Agency:** Defense Health Agency (DHA)
- **Contract Number:** HT0011-23-C-0019 | Value: $4.2M (Prime SDVOSB)
- **Scope:** Modernized clinical application workloads into GovCloud, meeting stringent HIPAA & DoD IL5 requirements.
- **CPARS Rating:** Exceptional across Quality, Schedule, Management, and Cost Control.

### Contract Reference 2: VA Patient Record Integration Infrastructure
- **Client Agency:** Department of Veterans Affairs (VA)
- **Contract Number:** 36C10B24C0082 | Value: $2.1M (Prime SDVOSB)
- **Scope:** Automated API gateway and data integrity assurance pipelines for VA medical centers nationwide.
- **CPARS Rating:** Very Good / Exceptional.`;

  const storage = new StorageService(c.env.BUCKET);
  const generator = new RfiGenerator(storage);

  const result = await generator.generateAndStore(opp, {
    companyName,
    uei,
    cageCode,
    sdvosbCertified,
    coreCompetencies,
    pastPerformance,
    templateType: body.templateType || "sources_sought",
    pocName: body.pocName || auth?.user?.name || "Director of Capture",
    pocEmail: body.pocEmail || auth?.user?.email || "capture@sdvosb-proposals.mil",
    pocPhone: body.pocPhone || "(555) 789-0123",
    customApproach: body.customApproach,
    subcontractingPlan: body.subcontractingPlan,
    proposedPrice: body.proposedPrice,
    deliveryTimelineDays: body.deliveryTimelineDays,
  });

  // Record generated proposal into opportunity_attachments table
  const attId = crypto.randomUUID();
  await db.insert(opportunityAttachments).values({
    id: attId,
    opportunityId: opp.id,
    filename: result.filename,
    r2Key: result.r2Key,
    contentType: "text/markdown",
    parsedText: result.preview.substring(0, 4000),
  });

  // Automatically transition status to drafting_rfi if currently 'new' or 'reviewing_sow'
  if (opp.status === "new" || opp.status === "reviewing_sow" || opp.status === "analyzing") {
    await db
      .update(opportunities)
      .set({
        status: "drafting_rfi",
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(opportunities.id, opp.id));
  }

  // Log note
  await db.insert(opportunityNotes).values({
    id: crypto.randomUUID(),
    opportunityId: opp.id,
    organizationId: auth?.organizationId || null,
    authorEmail: auth?.user?.email || "capture-engine@sdvosb-proposals.mil",
    subject: `Generated Proposal Artifact (${result.filename})`,
    content: `Generated proposal (${body.templateType || "sources_sought"}) tailored to government requirements. Archived in R2 at ${result.r2Key}.`,
    source: "user",
  });

  return c.json({
    success: true,
    opportunityId: opp.id,
    r2Key: result.r2Key,
    filename: result.filename,
    preview: result.preview,
    html: result.html,
  });
});

// GET /api/v1/opportunities/:id/attachments/:attachmentId/download
apiRouter.get("/opportunities/:id/attachments/:attachmentId/download", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const attachmentId = c.req.param("attachmentId");
  const format = c.req.query("format");

  const [att] = await db
    .select()
    .from(opportunityAttachments)
    .where(
      and(
        eq(opportunityAttachments.id, attachmentId),
        eq(opportunityAttachments.opportunityId, id)
      )
    )
    .limit(1);

  if (!att) {
    return c.json({ error: "Attachment not found" }, 404);
  }

  const storage = new StorageService(c.env.BUCKET);
  const obj = await storage.getObject(att.r2Key);

  if (!obj) {
    return c.json({ error: "File not found in R2 storage" }, 404);
  }

  const headers = new Headers();
  headers.set("Content-Type", att.contentType || "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `inline; filename="${att.filename.replace(/"/g, "")}"`
  );

  return new Response(obj.body, { headers });
});

// POST /api/v1/opportunities/:id/notes (Add manual note)
apiRouter.post("/opportunities/:id/notes", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const auth = c.get("auth");
  const body = await c.req.json<{ subject?: string; content: string }>();

  if (!body.content) {
    return c.json({ error: "content is required" }, 400);
  }

  const noteId = crypto.randomUUID();
  await db.insert(opportunityNotes).values({
    id: noteId,
    opportunityId: id,
    organizationId: auth?.organizationId || null,
    authorEmail: auth?.user?.email || "capture-analyst@sdvosb-proposals.mil",
    subject: body.subject || "Capture Strategy Note",
    content: body.content,
    source: "user",
  });

  return c.json({ success: true, noteId });
});

// ==========================================
// 3. Saved Search Profiles CRUD
// ==========================================

apiRouter.get("/saved-search-profiles", async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");
  const orgId = auth?.organizationId;

  const whereClause = orgId ? eq(savedSearchProfiles.organizationId, orgId) : undefined;
  const profiles = await db.select().from(savedSearchProfiles).where(whereClause);

  return c.json({ data: profiles });
});

apiRouter.post("/saved-search-profiles", requireRole(["admin", "manager"]), async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");
  const body = await c.req.json<{
    name: string;
    naicsCodes?: string[];
    setAsides?: string[];
    noticeTypes?: string[];
    pscCodes?: string[];
    minValue?: number;
    maxValue?: number;
    active?: boolean;
    organizationId?: string;
  }>();

  if (!body.name) {
    return c.json({ error: "name is required" }, 400);
  }

  const orgId = body.organizationId || auth?.organizationId || "org_demo_sdvosb";
  const id = crypto.randomUUID();

  await db.insert(savedSearchProfiles).values({
    id,
    organizationId: orgId,
    name: body.name,
    naicsCodes: JSON.stringify(body.naicsCodes || ["541512", "541519"]),
    setAsides: JSON.stringify(body.setAsides || ["SDVOSBC"]),
    noticeTypes: JSON.stringify(body.noticeTypes || ["r", "o"]),
    pscCodes: JSON.stringify(body.pscCodes || []),
    minValue: body.minValue ?? null,
    maxValue: body.maxValue ?? 250000,
    active: body.active !== undefined ? body.active : true,
  });

  return c.json({ success: true, id }, 201);
});

apiRouter.patch("/saved-search-profiles/:id", requireRole(["admin", "manager"]), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id") as string;
  const body = await c.req.json<{
    name?: string;
    naicsCodes?: string[];
    setAsides?: string[];
    active?: boolean;
    maxValue?: number;
  }>();

  const updateFields: any = {
    updatedAt: sql`(datetime('now'))`,
  };

  if (body.name !== undefined) updateFields.name = body.name;
  if (body.naicsCodes !== undefined) updateFields.naicsCodes = JSON.stringify(body.naicsCodes);
  if (body.setAsides !== undefined) updateFields.setAsides = JSON.stringify(body.setAsides);
  if (body.active !== undefined) updateFields.active = body.active;
  if (body.maxValue !== undefined) updateFields.maxValue = body.maxValue;

  await db.update(savedSearchProfiles).set(updateFields).where(eq(savedSearchProfiles.id, id));

  return c.json({ success: true, id });
});

apiRouter.delete("/saved-search-profiles/:id", requireRole(["admin"]), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id") as string;
  await db.delete(savedSearchProfiles).where(eq(savedSearchProfiles.id, id));
  return c.json({ success: true, id });
});

// ==========================================
// 4. Capability Statements CRUD
// ==========================================

apiRouter.get("/capability-statements", async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");
  const orgId = auth?.organizationId;

  const whereClause = orgId ? eq(capabilityStatements.organizationId, orgId) : undefined;
  const list = await db.select().from(capabilityStatements).where(whereClause);

  return c.json({ data: list });
});

apiRouter.post("/capability-statements", requireRole(["admin", "manager"]), async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");
  const body = await c.req.json<{
    title: string;
    coreCompetencies: string;
    pastPerformance: string;
    dunsUei: string;
    cageCode: string;
    sdvosbCertified?: boolean;
    organizationId?: string;
  }>();

  if (!body.title || !body.dunsUei || !body.cageCode) {
    return c.json({ error: "title, dunsUei, and cageCode are required" }, 400);
  }

  const orgId = body.organizationId || auth?.organizationId || "org_demo_sdvosb";
  const id = crypto.randomUUID();

  await db.insert(capabilityStatements).values({
    id,
    organizationId: orgId,
    title: body.title,
    coreCompetencies: body.coreCompetencies || "Enterprise Cloud, Zero Trust, Cyber Defense",
    pastPerformance: body.pastPerformance || "Federal Past Performance with DHA and VA",
    dunsUei: body.dunsUei,
    cageCode: body.cageCode,
    sdvosbCertified: body.sdvosbCertified !== undefined ? body.sdvosbCertified : true,
  });

  return c.json({ success: true, id }, 201);
});

apiRouter.delete("/capability-statements/:id", requireRole(["admin"]), async (c) => {
  const db = c.get("db");
  const id = c.req.param("id") as string;
  await db.delete(capabilityStatements).where(eq(capabilityStatements.id, id));
  return c.json({ success: true, id });
});

// ==========================================
// 5. Ingestion, Seeding & Email Trigger Tools
// ==========================================

// POST /api/v1/seed (Initializes realistic SDVOSB opportunities, profiles, and communications)
apiRouter.post("/seed", requireRole(["admin"]), async (c) => {
  await seedDatabase(c.env.DB, c.env.BUCKET);
  return c.json({
    success: true,
    message: "Successfully seeded multi-tenant SDVOSB opportunities, profiles, and capability records.",
  });
});

// POST /api/v1/seed/purge (Purges all seeded/demo records and enriches live SAM.gov records from R2 raw JSON)
apiRouter.post("/seed/purge", requireRole(["admin"]), async (c) => {
  const db = c.get("db");

  // 1. Delete all seeded demo opportunities (cascade deletes their notes, attachments, and alerts)
  await db
    .delete(opportunities)
    .where(sql`${opportunities.id} LIKE 'sam-sdvosb-%'`);

  // 2. Delete demo non-admin users (Marcus & Sarah), keeping real / admin accounts
  await db
    .delete(users)
    .where(sql`${users.id} IN ('user_marcus_mgr', 'user_sarah_member')`);

  // 3. Reset all opportunities to 'new' so Reviewing SOW, Drafting, Submitted, and Won only contain user-triaged opportunities
  await db
    .update(opportunities)
    .set({ status: "new", updatedAt: sql`(datetime('now'))` });

  // 4. Sync Saved Search Profile with the user's 13 Priority NAICS Codes
  await db
    .delete(savedSearchProfiles)
    .where(eq(savedSearchProfiles.id, "profile-dod-sat"));

  await db
    .insert(savedSearchProfiles)
    .values({
      id: "profile-va-cyber",
      organizationId: "org_demo_sdvosb",
      name: "Priority SDVOSB Target NAICS (13 Core Codes)",
      naicsCodes: JSON.stringify(PRIORITY_NAICS_LIST),
      setAsides: JSON.stringify(["SDVOSBC", "SDVOSBS", "VOSBC", "SBA"]),
      noticeTypes: JSON.stringify(["p", "r", "k", "o", "s", "a"]),
      active: true,
    })
    .onConflictDoUpdate({
      target: savedSearchProfiles.id,
      set: {
        name: "Priority SDVOSB Target NAICS (13 Core Codes)",
        naicsCodes: JSON.stringify(PRIORITY_NAICS_LIST),
        setAsides: JSON.stringify(["SDVOSBC", "SDVOSBS", "VOSBC", "SBA"]),
        noticeTypes: JSON.stringify(["p", "r", "k", "o", "s", "a"]),
        active: true,
      },
    });

  // 4. Backfill Contracting Officer POC directory & Award Intel notes from R2 raw JSON for live SAM.gov records
  const liveOpps = await db.select().from(opportunities).limit(100);
  const existingPocNotes = await db
    .select()
    .from(opportunityNotes)
    .where(eq(opportunityNotes.source, "poc_directory"));
  const existingPocOppIds = new Set(existingPocNotes.map((n) => n.opportunityId));

  let enrichedFromR2 = 0;
  let agenciesBackfilled = 0;
  for (const opp of liveOpps) {
    if (!opp.rawJsonR2Key) continue;
    const needsAgencyFix = opp.agency === "FEDERAL AGENCY";
    const needsPocNote = !existingPocOppIds.has(opp.id);
    if (!needsAgencyFix && !needsPocNote) continue;
    try {
      const obj = await c.env.BUCKET.get(opp.rawJsonR2Key);
      if (!obj) continue;
      const notice = (await obj.json()) as any;
      const hierarchy = parseSamAgencyHierarchy(notice);

      if (needsAgencyFix && hierarchy.agency !== "FEDERAL AGENCY") {
        await db
          .update(opportunities)
          .set({
            agency: hierarchy.agency,
            subTier: hierarchy.subTier,
            office: hierarchy.office,
          })
          .where(eq(opportunities.id, opp.id));
        agenciesBackfilled++;
      }

      if (needsPocNote && notice.pointOfContact && Array.isArray(notice.pointOfContact) && notice.pointOfContact.length > 0) {
        const pocLines = notice.pointOfContact.map(
          (p: any, idx: number) =>
            `${idx + 1}. ${p.fullName || "Contracting Officer"} (${(p.type || "primary").toUpperCase()}) — Email: ${p.email || "N/A"} | Phone: ${p.phone || "N/A"}`
        );
        await db.insert(opportunityNotes).values({
          id: crypto.randomUUID(),
          opportunityId: opp.id,
          organizationId: "org_demo_sdvosb",
          authorEmail: opp.pointOfContactEmail || "sam-contacts@sdvosb-platform.internal",
          subject: `Contracting Officer & OSDBU Contact Directory (${opp.solicitationNumber || opp.id})`,
          content: `Procuring Office: ${[hierarchy.agency, hierarchy.subTier, hierarchy.office].filter(Boolean).join(" / ")}\n\nRegistered Points of Contact:\n${pocLines.join("\n")}`,
          source: "poc_directory",
        });
        enrichedFromR2++;
      }
      if (needsPocNote && notice.award && (notice.award.amount || notice.award.awardee)) {
        const awardAmt = notice.award.amount
          ? `$${Number(notice.award.amount).toLocaleString("en-US")}`
          : "Published in SAM.gov";
        const awardeeName = notice.award.awardee?.name || "Awarded Prime Contractor";
        const awardeeUei = notice.award.awardee?.ueiSAM || "N/A";
        await db.insert(opportunityNotes).values({
          id: crypto.randomUUID(),
          opportunityId: opp.id,
          organizationId: "org_demo_sdvosb",
          authorEmail: "award-intelligence@sdvosb-platform.internal",
          subject: `🏆 Live SAM.gov Contract Award (${awardAmt})`,
          content: `Official SAM.gov Award Notice for ${opp.solicitationNumber}:\n• Winning Prime: ${awardeeName} (UEI: ${awardeeUei})\n• Award Value: ${awardAmt}\n• Award Date: ${notice.award.date || opp.postedDate}`,
          source: "award_intel",
        });
      }
    } catch {
      // ignore individual R2 parse errors
    }
  }

  const [remaining] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities);

  return c.json({
    success: true,
    liveOpportunitiesRemaining: remaining?.count || 0,
    contactsEnrichedFromR2: enrichedFromR2,
    agenciesBackfilled,
    message: `Purged all seeded demo records. ${remaining?.count || 0} live SAM.gov opportunities active (${enrichedFromR2} enriched with full KO contact cards, ${agenciesBackfilled} agency hierarchies decoded from R2).`,
  });
});

// POST /api/v1/ingest/run (Manual trigger for polling SAM.gov)
apiRouter.post("/ingest/run", requireRole(["admin", "manager"]), async (c) => {
  let body: { lookbackDays?: number; naicsCode?: string } = {};
  try {
    body = await c.req.json();
  } catch {
    // empty body is valid
  }
  const result = await runSamIngestion(c.env, {
    lookbackDays: body.lookbackDays || 14,
    naicsCode: body.naicsCode,
  });
  return c.json(result);
});

// POST /api/v1/email/simulate (Simulate inbound email for testing)
apiRouter.post("/email/simulate", async (c) => {
  const body = await c.req.json<{
    from: string;
    to: string;
    subject: string;
    text: string;
  }>();

  if (!body.from || !body.subject || !body.text) {
    return c.json({ error: "from, subject, and text are required" }, 400);
  }

  const rawEml = `From: ${body.from}
To: ${body.to || "capture@sdvosb-proposals.mil"}
Subject: ${body.subject}
Date: ${new Date().toUTCString()}
Message-ID: <sim-${Date.now()}@mil>
Content-Type: text/plain; charset=utf-8

${body.text}`;

  const enc = new TextEncoder();
  const rawBytes = enc.encode(rawEml);

  const headers = new Headers();
  headers.set("Message-ID", `<sim-${Date.now()}@mil>`);
  headers.set("Subject", body.subject);

  const result = await handleInboundEmail(
    {
      from: body.from,
      to: body.to || "capture@sdvosb-proposals.mil",
      headers,
      raw: rawBytes.buffer as ArrayBuffer,
    },
    c.env
  );

  return c.json(result);
});

// ==========================================
// 6. Bidirectional Channel Communication (KO & OSDBU Dispatch + Contact Directory)
// ==========================================

// POST /api/v1/opportunities/:id/send-email (Dispatch capability statement, Q&A, or Rule-of-Two letter directly to KO/OSDBU)
apiRouter.post("/opportunities/:id/send-email", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const auth = c.get("auth");
  const body = await c.req.json<{
    to?: string;
    ccOsdbu?: string;
    subject: string;
    content: string;
    markAsSubmitted?: boolean;
  }>();

  if (!body.subject || !body.content) {
    return c.json({ error: "subject and content are required" }, 400);
  }

  const [opp] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!opp) {
    return c.json({ error: "Opportunity not found" }, 404);
  }

  const recipientEmail = (body.to || opp.pointOfContactEmail || "").trim();
  if (!recipientEmail) {
    return c.json({ error: "Recipient email address (Contracting Officer POC) is required" }, 400);
  }

  const solNumClean = (opp.solicitationNumber || opp.id).replace(/[^a-zA-Z0-9-_]/g, "");
  const inboundDomain = c.env.INBOUND_EMAIL_DOMAIN || "sdvosb-proposals.mil";
  const replyToAddress = `capture+${solNumClean}@${inboundDomain}`;

  const recipients = [recipientEmail];
  if (body.ccOsdbu && body.ccOsdbu.trim()) {
    recipients.push(body.ccOsdbu.trim());
  }

  const dispatcher = new OutboundEmailDispatcher(c.env);
  const dispatchResult = await dispatcher.send({
    to: recipients,
    subject: body.subject.includes(solNumClean) ? body.subject : `[${solNumClean}] ${body.subject}`,
    text: body.content,
    replyTo: replyToAddress,
  });

  if (!dispatchResult.success) {
    return c.json({ error: dispatchResult.error || "Failed to dispatch email" }, 500);
  }

  // Record outbound correspondence in opportunity_notes for bidirectional audit trail
  const noteId = crypto.randomUUID();
  const senderEmail = auth?.user?.email || "capture-director@sdvosb-proposals.mil";
  await db.insert(opportunityNotes).values({
    id: noteId,
    opportunityId: opp.id,
    organizationId: auth?.organizationId || null,
    authorEmail: `${senderEmail} ➔ ${recipients.join(", ")}`,
    subject: `📤 Outbound KO/OSDBU Dispatch: ${body.subject}`,
    content: `Dispatched to: ${recipients.join(", ")}\nReply-To Threading Address: ${replyToAddress}\nMessage ID: ${dispatchResult.messageId || "N/A"}\n\n${body.content}`,
    source: "outbound_email",
  });

  if (body.markAsSubmitted && opp.status !== "won") {
    await db
      .update(opportunities)
      .set({
        status: "submitted",
        updatedAt: sql`(datetime('now'))`,
      })
      .where(eq(opportunities.id, opp.id));
  }

  return c.json({
    success: true,
    messageId: dispatchResult.messageId,
    recipients,
    replyTo: replyToAddress,
    noteId,
  });
});

// GET /api/v1/contacts (Aggregated Contracting Officer, Contract Specialist & Agency OSDBU Directory)
apiRouter.get("/contacts", async (c) => {
  const db = c.get("db");

  const allOpps = await db
    .select()
    .from(opportunities)
    .orderBy(desc(opportunities.postedDate));

  const pocNotes = await db
    .select()
    .from(opportunityNotes)
    .where(sql`${opportunityNotes.source} IN ('poc_directory', 'email', 'outbound_email')`)
    .orderBy(desc(opportunityNotes.createdAt));

  const contactMap = new Map<
    string,
    {
      email: string;
      name: string;
      role: string;
      phone: string;
      agency: string;
      office: string;
      solicitations: Array<{ id: string; solicitationNumber: string; title: string; status: string }>;
    }
  >();

  for (const opp of allOpps) {
    const email = (opp.pointOfContactEmail || "").trim().toLowerCase();
    if (!email) continue;

    if (!contactMap.has(email)) {
      const isOsdbu = email.includes("osdbu") || email.includes("osbp") || email.includes("smallbusiness");
      contactMap.set(email, {
        email,
        name: email.split("@")[0].replace(/[._]/g, " ").toUpperCase(),
        role: isOsdbu ? "OSDBU Small Business Specialist" : "Procuring Contracting Officer (KO)",
        phone: "See Solicitation Notice",
        agency: opp.agency || "Federal Agency",
        office: opp.office || opp.subTier || "Contracting Office",
        solicitations: [],
      });
    }

    const entry = contactMap.get(email)!;
    if (!entry.solicitations.some((s) => s.id === opp.id)) {
      entry.solicitations.push({
        id: opp.id,
        solicitationNumber: opp.solicitationNumber || opp.id,
        title: opp.title,
        status: opp.status,
      });
    }
  }

  // Enrich names & phones from parsed poc_directory / email notes
  for (const note of pocNotes) {
    const emailMatch = note.authorEmail.match(/<([^>]+)>/) || [null, note.authorEmail];
    const cleanEmail = (emailMatch[1] || "").trim().toLowerCase();
    if (cleanEmail && contactMap.has(cleanEmail)) {
      const entry = contactMap.get(cleanEmail)!;
      if (note.authorEmail.includes("<")) {
        entry.name = note.authorEmail.split("<")[0].trim();
      }
    }
    // Also parse structured lines from poc_directory notes
    if (note.source === "poc_directory") {
      const lines = note.content.split("\n");
      for (const line of lines) {
        const m = line.match(/^\d+\.\s+(.+?)\s+\((PRIMARY|SECONDARY)\)\s+—\s+Email:\s+([^\s|]+)\s+\|\s+Phone:\s+(.+)$/i);
        if (m) {
          const [, fullName, pocType, rawEmail, phone] = m;
          const eKey = rawEmail.trim().toLowerCase();
          if (eKey && eKey !== "n/a") {
            const parentOpp = allOpps.find((o) => o.id === note.opportunityId);
            const existing = contactMap.get(eKey) || {
              email: eKey,
              name: fullName.trim(),
              role:
                pocType.toUpperCase() === "SECONDARY" || fullName.toLowerCase().includes("osdbu") || fullName.toLowerCase().includes("osbp")
                  ? "OSDBU / Small Business Specialist"
                  : "Procuring Contracting Officer (KO)",
              phone: phone.trim(),
              agency: parentOpp?.agency || "Federal Agency",
              office: parentOpp?.office || parentOpp?.subTier || "Contracting Office",
              solicitations: [],
            };
            existing.name = fullName.trim();
            existing.phone = phone.trim();
            if (parentOpp && !existing.solicitations.some((s) => s.id === parentOpp.id)) {
              existing.solicitations.push({
                id: parentOpp.id,
                solicitationNumber: parentOpp.solicitationNumber || parentOpp.id,
                title: parentOpp.title,
                status: parentOpp.status,
              });
            }
            contactMap.set(eKey, existing);
          }
        }
      }
    }
  }

  return c.json({
    contacts: Array.from(contactMap.values()),
  });
});

// ==========================================
// 7. Compliance Calculator (FAR 52.219-27 / 13 CFR 125.6) & Award Intelligence
// ==========================================

// POST /api/v1/compliance/calculate-los
apiRouter.post("/compliance/calculate-los", async (c) => {
  const db = c.get("db");
  const auth = c.get("auth");
  const body = await c.req.json<{
    opportunityId?: string;
    procurementType?: ProcurementCategory;
    totalContractValue: number;
    costOfMaterials?: number;
    primeDirectDollars: number;
    similarlySituatedSubDollars?: number;
    nonSdvosbSubDollars: number;
    naicsCode?: string;
    saveToNotes?: boolean;
  }>();

  const losResult = calculateLimitationsOnSubcontracting({
    procurementType: body.procurementType || "services",
    totalContractValue: Number(body.totalContractValue || 0),
    costOfMaterials: Number(body.costOfMaterials || 0),
    primeDirectDollars: Number(body.primeDirectDollars || 0),
    similarlySituatedSubDollars: Number(body.similarlySituatedSubDollars || 0),
    nonSdvosbSubDollars: Number(body.nonSdvosbSubDollars || 0),
  });

  const nmrCheck = checkNonManufacturerRule(body.naicsCode || "541512");

  if (body.opportunityId && body.saveToNotes) {
    await db.insert(opportunityNotes).values({
      id: crypto.randomUUID(),
      opportunityId: body.opportunityId,
      organizationId: auth?.organizationId || null,
      authorEmail: auth?.user?.email || "compliance-engine@sdvosb-proposals.mil",
      subject: `FAR 52.219-27 Subcontracting Audit: ${losResult.compliant ? "COMPLIANT ✅" : "NON-COMPLIANT ❌"} (SDVOSB Team: ${losResult.effectiveSdvosbTeamPercent}%)`,
      content: `${losResult.sectionLNarrative}\n\n• Non-Manufacturer Rule (${nmrCheck.naicsCode}): ${nmrCheck.waiverSummary}\n• Strategy: ${nmrCheck.resellerStrategy}`,
      source: "compliance_audit",
    });
  }

  return c.json({
    los: losResult,
    nmr: nmrCheck,
  });
});

// GET /api/v1/opportunities/:id/award-intel
apiRouter.get("/opportunities/:id/award-intel", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");

  const [opp] = await db
    .select()
    .from(opportunities)
    .where(eq(opportunities.id, id))
    .limit(1);

  if (!opp) {
    return c.json({ error: "Opportunity not found" }, 404);
  }

  const awardIntel = await fetchHistoricalAwardIntelligence(
    opp.naicsCode || "541512",
    opp.agency || "Department of Veterans Affairs"
  );
  const nmrCheck = checkNonManufacturerRule(opp.naicsCode || "541512");

  return c.json({
    opportunityId: opp.id,
    solicitationNumber: opp.solicitationNumber,
    naicsCode: opp.naicsCode,
    awardIntelligence: awardIntel,
    nmrWaiverStatus: nmrCheck,
  });
});

