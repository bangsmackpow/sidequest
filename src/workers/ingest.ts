import { Env } from "../types/env";
import { createDb } from "../db";
import {
  opportunities,
  savedSearchProfiles,
  opportunityAlerts,
  opportunityNotes,
} from "../db/schema";
import { SamGovClient, SamGovNotice } from "../services/sam-api";
import { StorageService } from "../services/storage";
import { sql, eq } from "drizzle-orm";

export interface IngestionResult {
  success: boolean;
  noticesProcessed: number;
  alertsCreated: number;
  syncTimestamp: string;
  error?: string;
}

export async function runSamIngestion(env: Env): Promise<IngestionResult> {
  const db = createDb(env.DB);
  const storage = new StorageService(env.BUCKET);
  const samClient = new SamGovClient(env.SAM_GOV_API_KEY);

  // 1. State Management: Read last run timestamp from KV
  const lastSyncIso = await env.KV.get("sam_last_sync_timestamp");
  const now = new Date();
  let postedFromDate: Date;

  if (lastSyncIso) {
    postedFromDate = new Date(lastSyncIso);
    // If the saved date is invalid or in the future, default to 24 hours ago
    if (isNaN(postedFromDate.getTime()) || postedFromDate > now) {
      postedFromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
  } else {
    // Default to past 24 hours
    postedFromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }

  const postedFrom = SamGovClient.formatSamDate(postedFromDate);
  const postedTo = SamGovClient.formatSamDate(now);

  console.log(`[Ingest Engine] Polling SAM.gov from ${postedFrom} to ${postedTo}`);

  try {
    // 2. Fetch active saved search profiles for alert matching
    const activeProfiles = await db
      .select()
      .from(savedSearchProfiles)
      .where(eq(savedSearchProfiles.active, true));

    // 3. API Retrieval: Call SAM.gov Opportunities Search
    const { notices } = await samClient.fetchOpportunities({
      postedFrom,
      postedTo,
      limit: 100,
      ptype: "r,o", // Sources Sought (r) & Solicitations (o)
      typeOfSetAside: "SDVOSBC",
    });

    console.log(`[Ingest Engine] Retrieved ${notices.length} notices from SAM.gov`);

    let noticesProcessed = 0;
    let alertsCreated = 0;

    for (const notice of notices) {
      if (!notice.noticeId) continue;

      // Save raw opportunity JSON into Cloudflare R2
      const rawJsonR2Key = await storage.saveRawOpportunityJson(notice.noticeId, notice);

      // Extract primary contact email
      const primaryPoc = notice.pointOfContact?.find((p) => p.email) || notice.pointOfContact?.[0];
      const pocEmail = primaryPoc?.email || null;

      // Upsert into D1 opportunities table (preserve pipeline status if existing)
      await db
        .insert(opportunities)
        .values({
          id: notice.noticeId,
          solicitationNumber: notice.solicitationNumber || `NOTICE-${notice.noticeId.substring(0, 8)}`,
          title: notice.title || "Untitled SDVOSB Solicitation",
          agency: notice.department || "FEDERAL AGENCY",
          subTier: notice.subTier || null,
          office: notice.office || null,
          postedDate: notice.postedDate || new Date().toISOString().split("T")[0],
          responseDeadline: notice.responseDeadLine || null,
          naicsCode: notice.naicsCode || null,
          setAsideCode: notice.typeOfSetAside || "SDVOSBC",
          noticeType: notice.type || "r",
          uiLink: notice.uiLink || `https://sam.gov/opp/${notice.noticeId}/view`,
          pointOfContactEmail: pocEmail,
          rawJsonR2Key,
          status: "new",
          createdAt: sql`(datetime('now'))`,
          updatedAt: sql`(datetime('now'))`,
        })
        .onConflictDoUpdate({
          target: opportunities.id,
          set: {
            title: sql`excluded.title`,
            agency: sql`excluded.agency`,
            subTier: sql`excluded.sub_tier`,
            office: sql`excluded.office`,
            responseDeadline: sql`excluded.response_deadline`,
            rawJsonR2Key: sql`excluded.raw_json_r2_key`,
            updatedAt: sql`(datetime('now'))`,
          },
        });

      noticesProcessed++;

      // Compare against saved_search_profiles
      for (const profile of activeProfiles) {
        let naicsMatch = false;
        let setAsideMatch = false;
        let noticeTypeMatch = false;

        try {
          const profileNaics: string[] = JSON.parse(profile.naicsCodes || "[]");
          if (profileNaics.length === 0 || (notice.naicsCode && profileNaics.includes(notice.naicsCode))) {
            naicsMatch = true;
          }
        } catch {
          naicsMatch = true;
        }

        try {
          const profileSetAsides: string[] = JSON.parse(profile.setAsides || "[]");
          if (
            profileSetAsides.length === 0 ||
            (notice.typeOfSetAside && profileSetAsides.includes(notice.typeOfSetAside))
          ) {
            setAsideMatch = true;
          }
        } catch {
          setAsideMatch = true;
        }

        try {
          const profileTypes: string[] = JSON.parse(profile.noticeTypes || "[]");
          if (
            profileTypes.length === 0 ||
            (notice.type && profileTypes.some((t) => notice.type?.toLowerCase().includes(t.toLowerCase())))
          ) {
            noticeTypeMatch = true;
          }
        } catch {
          noticeTypeMatch = true;
        }

        if (naicsMatch && setAsideMatch && noticeTypeMatch) {
          const matchReasons: string[] = [];
          if (notice.type === "r" || notice.type?.toLowerCase().includes("sources sought")) {
            matchReasons.push("High-Priority SDVOSB Sources Sought / RFI");
          }
          if (notice.naicsCode) {
            matchReasons.push(`Target NAICS: ${notice.naicsCode}`);
          }
          if (notice.typeOfSetAside) {
            matchReasons.push(`Set-Aside: ${notice.typeOfSetAside}`);
          }

          // Insert audit / alert record
          const alertId = crypto.randomUUID();
          await db.insert(opportunityAlerts).values({
            id: alertId,
            opportunityId: notice.noticeId,
            profileId: profile.id,
            organizationId: profile.organizationId,
            matchedCriteria: JSON.stringify({
              profileName: profile.name,
              reasons: matchReasons,
              matchedAt: new Date().toISOString(),
            }),
          });

          // Log alert note into opportunity_notes
          await db.insert(opportunityNotes).values({
            id: crypto.randomUUID(),
            opportunityId: notice.noticeId,
            organizationId: profile.organizationId,
            authorEmail: "system-capture-engine@sdvosb-platform.internal",
            subject: `SDVOSB Capture Alert: Matched "${profile.name}"`,
            content: `Opportunity flagged based on profile "${profile.name}". Reasons: ${matchReasons.join(", ")}. Response deadline: ${notice.responseDeadLine || "Unspecified"}.`,
            source: "system_alert",
          });

          alertsCreated++;
        }
      }
    }

    // Update KV sam_last_sync_timestamp to current execution time
    const syncTimestamp = now.toISOString();
    await env.KV.put("sam_last_sync_timestamp", syncTimestamp);

    return {
      success: true,
      noticesProcessed,
      alertsCreated,
      syncTimestamp,
    };
  } catch (err: any) {
    console.error("[Ingest Engine] Synchronization error:", err);
    return {
      success: false,
      noticesProcessed: 0,
      alertsCreated: 0,
      syncTimestamp: now.toISOString(),
      error: err.message || "Unknown error during SAM.gov ingestion",
    };
  }
}
