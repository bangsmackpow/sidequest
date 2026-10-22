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
} from "../db/schema";
import { eq, and, like, desc, sql, gte, lte } from "drizzle-orm";
import { StorageService } from "../services/storage";
import { RfiGenerator } from "../services/rfi-generator";
import { runSamIngestion } from "../workers/ingest";
import { handleInboundEmail } from "../workers/email";

export const apiRouter = new Hono<{ Bindings: Env }>();

// All routes under /api/v1/* are protected via authMiddleware
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
  const [draftingCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(opportunities)
    .where(
      sql`${opportunities.status} IN ('drafting_rfi', 'pursuing', 'reviewing_sow', 'analyzing')`
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

// GET /api/v1/opportunities (Filterable by NAICS, set-aside, status, deadline, query)
apiRouter.get("/opportunities", async (c) => {
  const db = c.get("db");
  const naics = c.req.query("naics");
  const setAside = c.req.query("set_aside");
  const status = c.req.query("status");
  const deadlineBefore = c.req.query("deadline_before");
  const deadlineAfter = c.req.query("deadline_after");
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
  if (status) {
    conditions.push(eq(opportunities.status, status));
  }
  if (deadlineBefore) {
    conditions.push(lte(opportunities.responseDeadline, deadlineBefore));
  }
  if (deadlineAfter) {
    conditions.push(gte(opportunities.responseDeadline, deadlineAfter));
  }
  if (query) {
    conditions.push(
      sql`(${opportunities.title} LIKE ${`%${query}%`} OR ${opportunities.solicitationNumber} LIKE ${`%${query}%`} OR ${opportunities.agency} LIKE ${`%${query}%`})`
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
    pocName: body.pocName || auth?.user?.name || "Director of Capture",
    pocEmail: body.pocEmail || auth?.user?.email || "capture@sdvosb-proposals.mil",
    pocPhone: body.pocPhone || "(555) 789-0123",
    customApproach: body.customApproach,
    subcontractingPlan: body.subcontractingPlan,
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
    subject: `Generated SDVOSB RFI Response (${result.filename})`,
    content: `Generated comprehensive Sources Sought / RFI proposal response tailored to Section L requirements. Archived in R2 at ${result.r2Key}.`,
    source: "user",
  });

  return c.json({
    success: true,
    opportunityId: opp.id,
    r2Key: result.r2Key,
    filename: result.filename,
    preview: result.preview,
  });
});

// GET /api/v1/opportunities/:id/attachments/:attachmentId/download
apiRouter.get("/opportunities/:id/attachments/:attachmentId/download", async (c) => {
  const db = c.get("db");
  const id = c.req.param("id");
  const attachmentId = c.req.param("attachmentId");

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

// ==========================================
// 5. Ingestion & Email Trigger Tools
// ==========================================

// POST /api/v1/ingest/run (Manual trigger for polling SAM.gov)
apiRouter.post("/ingest/run", requireRole(["admin", "manager"]), async (c) => {
  const result = await runSamIngestion(c.env);
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
