import { Env } from "../types/env";
import { createDb } from "../db";
import {
  opportunities,
  savedSearchProfiles,
  opportunityAlerts,
  opportunityNotes,
  opportunityAttachments,
  users,
} from "../db/schema";
import { SamGovClient, SamGovNotice } from "../services/sam-api";
import { StorageService } from "../services/storage";
import { OutboundEmailDispatcher } from "./outbound-email";
import { sql, eq, or } from "drizzle-orm";

export interface IngestionResult {
  success: boolean;
  noticesProcessed: number;
  alertsCreated: number;
  amendmentsDetected?: number;
  attachmentsIngested?: number;
  emailsDispatched?: number;
  syncTimestamp: string;
  error?: string;
}

export async function runSamIngestion(env: Env): Promise<IngestionResult> {
  const db = createDb(env.DB);
  const storage = new StorageService(env.BUCKET);
  const samClient = new SamGovClient(env.SAM_GOV_API_KEY);
  const emailDispatcher = new OutboundEmailDispatcher(env);

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

    // 3. API Retrieval: Call SAM.gov Opportunities Search across full notice lifecycle:
    // p = Presolicitation, r = Sources Sought, k = Combined Synopsis/Solicitation, o = Solicitation, s = Special Notice, a = Award Notice
    const { notices } = await samClient.fetchOpportunities({
      postedFrom,
      postedTo,
      limit: 100,
      ptype: "p,r,k,o,s,a",
      typeOfSetAside: "SDVOSBC",
    });

    // If live API key is configured and any profile targets Rule-of-Two Shaping ("SBA" or "NONE"),
    // also fetch Sources Sought (ptype=r) in target NAICS codes to uncover Set-Aside Flip opportunities
    if (env.SAM_GOV_API_KEY) {
      const shapingNaics = new Set<string>();
      for (const p of activeProfiles) {
        try {
          const sa: string[] = JSON.parse(p.setAsides || "[]");
          const naics: string[] = JSON.parse(p.naicsCodes || "[]");
          if (sa.includes("SBA") || sa.includes("NONE") || sa.includes("RULE_OF_TWO")) {
            naics.forEach((n) => shapingNaics.add(n));
          }
        } catch {
          // ignore
        }
      }
      for (const ncode of Array.from(shapingNaics).slice(0, 3)) {
        try {
          const { notices: shapingNotices } = await samClient.fetchOpportunities({
            postedFrom,
            postedTo,
            limit: 50,
            ptype: "r",
            naicsCode: ncode,
          });
          for (const sn of shapingNotices) {
            if (!notices.some((existing) => existing.noticeId === sn.noticeId)) {
              notices.push(sn);
            }
          }
        } catch (err) {
          console.warn(`[Ingest Engine] Shaping query warning for NAICS ${ncode}:`, err);
        }
      }
    }

    console.log(`[Ingest Engine] Retrieved ${notices.length} notices from SAM.gov`);

    let noticesProcessed = 0;
    let alertsCreated = 0;
    let amendmentsDetected = 0;
    let attachmentsIngested = 0;
    let emailsDispatched = 0;
    const digestItems: string[] = [];

    for (const notice of notices) {
      if (!notice.noticeId) continue;

      const solNum = notice.solicitationNumber || `NOTICE-${notice.noticeId.substring(0, 8)}`;

      // Check for existing solicitation or noticeId to detect Amendments & Lifecycle Transitions
      const existingMatches = await db
        .select()
        .from(opportunities)
        .where(
          or(
            eq(opportunities.id, notice.noticeId),
            eq(opportunities.solicitationNumber, solNum)
          )
        )
        .limit(1);

      const existingOpp = existingMatches[0];

      // Save raw opportunity JSON into Cloudflare R2
      const rawJsonR2Key = await storage.saveRawOpportunityJson(notice.noticeId, notice);

      // Extract primary contact email
      const primaryPoc = notice.pointOfContact?.find((p) => p.email) || notice.pointOfContact?.[0];
      const pocEmail = primaryPoc?.email || null;

      // Determine initial status (Award Notices default to reviewing_sow / intelligence if not ours)
      const initialStatus = notice.type === "a" ? "reviewing_sow" : "new";

      // Upsert into D1 opportunities table (preserve pipeline status if existing)
      await db
        .insert(opportunities)
        .values({
          id: notice.noticeId,
          solicitationNumber: solNum,
          title: notice.title || "Untitled SDVOSB Solicitation",
          agency: notice.department || "FEDERAL AGENCY",
          subTier: notice.subTier || null,
          office: notice.office || null,
          postedDate: notice.postedDate || new Date().toISOString().split("T")[0],
          responseDeadline: notice.responseDeadLine || null,
          naicsCode: notice.naicsCode || null,
          setAsideCode: notice.typeOfSetAside || "NONE",
          noticeType: notice.type || "r",
          uiLink: notice.uiLink || `https://sam.gov/opp/${notice.noticeId}/view`,
          pointOfContactEmail: pocEmail,
          rawJsonR2Key,
          status: initialStatus,
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
            setAsideCode: sql`excluded.set_aside_code`,
            noticeType: sql`excluded.notice_type`,
            responseDeadline: sql`excluded.response_deadline`,
            rawJsonR2Key: sql`excluded.raw_json_r2_key`,
            updatedAt: sql`(datetime('now'))`,
          },
        });

      noticesProcessed++;

      // 4. Detect & Log Solicitation Amendments / Lifecycle Changes
      if (existingOpp) {
        const changes: string[] = [];
        if (
          notice.responseDeadLine &&
          existingOpp.responseDeadline &&
          notice.responseDeadLine.split("T")[0] !== existingOpp.responseDeadline.split("T")[0]
        ) {
          changes.push(
            `Response Deadline changed from ${existingOpp.responseDeadline.split("T")[0]} ➔ ${notice.responseDeadLine.split("T")[0]}`
          );
        }
        if (notice.typeOfSetAside && existingOpp.setAsideCode && notice.typeOfSetAside !== existingOpp.setAsideCode) {
          changes.push(
            `Set-Aside flipped from ${existingOpp.setAsideCode} ➔ ${notice.typeOfSetAside}`
          );
        }
        if (notice.type && existingOpp.noticeType && notice.type !== existingOpp.noticeType) {
          changes.push(
            `Lifecycle Notice Type transitioned from [${existingOpp.noticeType.toUpperCase()}] ➔ [${notice.type.toUpperCase()}]`
          );
        }

        if (changes.length > 0) {
          amendmentsDetected++;
          await db.insert(opportunityNotes).values({
            id: crypto.randomUUID(),
            opportunityId: notice.noticeId,
            organizationId: activeProfiles[0]?.organizationId || null,
            authorEmail: "amendment-watcher@sdvosb-platform.internal",
            subject: `⚠️ Solicitation Amendment / Lifecycle Update (${solNum})`,
            content: `Detected official SAM.gov modification on solicitation ${solNum}:\n• ${changes.join("\n• ")}`,
            source: "amendment",
          });
          digestItems.push(`[AMENDMENT] ${solNum} (${notice.title}): ${changes.join("; ")}`);
        }
      }

      // 5. Store Full Contracting Officer & OSDBU Contact Registry Metadata
      if (!existingOpp && notice.pointOfContact && notice.pointOfContact.length > 0) {
        const pocLines = notice.pointOfContact.map(
          (p, idx) =>
            `${idx + 1}. ${p.fullName || "Contracting Officer"} (${(p.type || "primary").toUpperCase()}) — Email: ${p.email || "N/A"} | Phone: ${p.phone || "N/A"}`
        );
        await db.insert(opportunityNotes).values({
          id: crypto.randomUUID(),
          opportunityId: notice.noticeId,
          organizationId: activeProfiles[0]?.organizationId || null,
          authorEmail: primaryPoc?.email || "sam-contacts@sdvosb-platform.internal",
          subject: `Contracting Officer & OSDBU Contact Directory (${solNum})`,
          content: `Procuring Office: ${[notice.department, notice.subTier, notice.office].filter(Boolean).join(" / ")}\n\nRegistered Points of Contact:\n${pocLines.join("\n")}`,
          source: "poc_directory",
        });
      }

      // 6. Store Award Notice Intelligence (Winner, Amount, Subcontracting / Recompete Data)
      if (!existingOpp && (notice.type === "a" || notice.award)) {
        const awardAmt = notice.award?.amount
          ? `$${notice.award.amount.toLocaleString("en-US")}`
          : "Unspecified";
        const awardeeName = notice.award?.awardee?.name || "Awarded Prime Contractor";
        const awardeeUei = notice.award?.awardee?.ueiSAM || "N/A";
        const awardeeCage = notice.award?.awardee?.cageCode || "N/A";

        await db.insert(opportunityNotes).values({
          id: crypto.randomUUID(),
          opportunityId: notice.noticeId,
          organizationId: activeProfiles[0]?.organizationId || null,
          authorEmail: "award-intelligence@sdvosb-platform.internal",
          subject: `🏆 Contract Award & Subcontracting Intelligence (${awardAmt})`,
          content: `Award Notice Recorded for ${solNum}:\n• Winning Prime: ${awardeeName} (UEI: ${awardeeUei} | CAGE: ${awardeeCage})\n• Award Ceiling / Obligated Value: ${awardAmt}\n• Contract Number: ${notice.award?.number || solNum}\n• Capture Action: Target ${awardeeName} for 13 CFR § 125.6 "Similarly Situated Entity" SDVOSB subcontracting or log expiration for Recompete pipeline.`,
          source: "award_intel",
        });
      }

      // 7. Auto-Ingest Resource Links (SOW / PWS / RFQ Attachments)
      if (notice.resourceLinks && notice.resourceLinks.length > 0) {
        const existingAtts = await db
          .select()
          .from(opportunityAttachments)
          .where(eq(opportunityAttachments.opportunityId, notice.noticeId));

        for (const link of notice.resourceLinks) {
          const filename = link.split("/").pop() || `SAM_Attachment_${notice.noticeId.substring(0, 6)}.pdf`;
          if (existingAtts.some((a) => a.filename === filename)) continue;

          const r2Key = `attachments/${notice.noticeId}/${filename}`;
          await env.BUCKET.put(
            r2Key,
            `SAM.gov Official Attachment Reference\nSolicitation: ${solNum}\nTitle: ${notice.title}\nSource URL: ${link}\nDescription: ${notice.description || "Statement of Work / Solicitation Package"}`,
            {
              httpMetadata: { contentType: "text/plain" },
            }
          );

          await db.insert(opportunityAttachments).values({
            id: crypto.randomUUID(),
            opportunityId: notice.noticeId,
            filename,
            r2Key,
            contentType: "text/plain",
            parsedText: `${notice.description || notice.title} (Source: ${link})`,
          });
          attachmentsIngested++;
        }
      }

      // 8. Compare against saved_search_profiles
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
            (notice.typeOfSetAside && profileSetAsides.includes(notice.typeOfSetAside)) ||
            (notice.type === "r" &&
              (notice.typeOfSetAside === "SBA" || notice.typeOfSetAside === "NONE") &&
              profileSetAsides.includes("SDVOSBC"))
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
            (notice.type && profileTypes.some((t) => notice.type?.toLowerCase().includes(t.toLowerCase()))) ||
            ["k", "s", "a", "p"].includes((notice.type || "").toLowerCase())
          ) {
            noticeTypeMatch = true;
          }
        } catch {
          noticeTypeMatch = true;
        }

        if (naicsMatch && setAsideMatch && noticeTypeMatch) {
          const matchReasons: string[] = [];
          const isRuleOfTwoTarget =
            notice.type === "r" &&
            notice.typeOfSetAside !== "SDVOSBC" &&
            notice.typeOfSetAside !== "SDVOSBS";

          if (isRuleOfTwoTarget) {
            matchReasons.push("🎯 Rule-of-Two Set-Aside Flip Target (FAR 19.1405 / Kingdomware)");
          } else if (notice.type === "r" || notice.type?.toLowerCase().includes("sources sought")) {
            matchReasons.push("High-Priority SDVOSB Sources Sought / RFI");
          } else if (notice.type === "k") {
            matchReasons.push("⚡ Fast-Track Combined Synopsis/Solicitation (FAR Part 12/13)");
          } else if (notice.type === "s") {
            matchReasons.push("🔒 Special Notice / Sole Source Intent (FAR 19.1406)");
          } else if (notice.type === "a") {
            matchReasons.push("🏆 Contract Award Intelligence (Subcontracting / Recompete)");
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
          digestItems.push(
            `[MATCH: ${profile.name}] ${solNum} — ${notice.title} (${matchReasons.join(", ")})`
          );
        }
      }
    }

    // 9. Dispatch Real-Time Outbound Email Digest when high-priority alerts or amendments occur
    if (digestItems.length > 0) {
      const adminUsers = await db
        .select()
        .from(users)
        .where(eq(users.role, "admin"))
        .limit(3);
      const recipients =
        adminUsers.length > 0
          ? adminUsers.map((u) => u.email)
          : ["admin@sdvosb-proposals.mil"];

      const dispatchRes = await emailDispatcher.send({
        to: recipients,
        subject: `[Sidequest SDVOSB Alert] ${alertsCreated} New Matches & ${amendmentsDetected} Amendments Detected`,
        text: `Sidequest SAM.gov Capture Digest (${now.toISOString()}):\n\n${digestItems.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n\nLog in to your Sidequest Capture Dashboard to review SOWs, shape Rule-of-Two Sources Sought notices, or dispatch capability statements directly to the Contracting Officer.`,
      });
      if (dispatchRes.success) {
        emailsDispatched++;
      }
    }

    // Update KV sam_last_sync_timestamp to current execution time
    const syncTimestamp = now.toISOString();
    await env.KV.put("sam_last_sync_timestamp", syncTimestamp);

    return {
      success: true,
      noticesProcessed,
      alertsCreated,
      amendmentsDetected,
      attachmentsIngested,
      emailsDispatched,
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
