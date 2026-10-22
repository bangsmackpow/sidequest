import PostalMime from "postal-mime";
import { Env } from "../types/env";
import { createDb } from "../db";
import { opportunities, opportunityNotes, opportunityAttachments } from "../db/schema";
import { StorageService } from "../services/storage";
import { eq, or, sql } from "drizzle-orm";

export interface EmailProcessingResult {
  matched: boolean;
  opportunityId?: string;
  solicitationNumber?: string;
  notesLogged: number;
  attachmentsSaved: number;
  messageId: string;
}

export async function handleInboundEmail(
  message: {
    from: string;
    to: string;
    headers: Headers;
    raw: ReadableStream<Uint8Array> | ArrayBuffer;
  },
  env: Env
): Promise<EmailProcessingResult> {
  const db = createDb(env.DB);
  const storage = new StorageService(env.BUCKET);

  const rawBuffer =
    message.raw instanceof ArrayBuffer
      ? message.raw
      : await new Response(message.raw).arrayBuffer();

  const parser = new PostalMime();
  const parsed = await parser.parse(rawBuffer);

  const messageIdHeader = message.headers.get("Message-ID") || message.headers.get("message-id");
  const messageId =
    messageIdHeader?.replace(/[<>]/g, "").trim() ||
    `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const subject = parsed.subject || "";
  const bodyText = parsed.text || "";
  const bodyHtml = parsed.html || "";
  const combinedContent = `${subject} \n ${bodyText}`;

  console.log(`[Email Handler] Inbound message from: ${message.from}, Subject: "${subject}"`);

  // Query database opportunities to match against known solicitation numbers or notice IDs
  const activeOpportunities = await db
    .select({
      id: opportunities.id,
      solicitationNumber: opportunities.solicitationNumber,
    })
    .from(opportunities);

  let matchedOpportunity: { id: string; solicitationNumber: string | null } | null = null;

  // 1. Direct match with existing opportunities in DB
  for (const opp of activeOpportunities) {
    if (opp.solicitationNumber && opp.solicitationNumber.trim().length > 3) {
      const cleanSol = opp.solicitationNumber.trim().toLowerCase();
      if (
        subject.toLowerCase().includes(cleanSol) ||
        bodyText.toLowerCase().includes(cleanSol)
      ) {
        matchedOpportunity = opp;
        break;
      }
    }
    // Match notice ID if in subject or body
    if (
      subject.toLowerCase().includes(opp.id.toLowerCase()) ||
      bodyText.toLowerCase().includes(opp.id.toLowerCase())
    ) {
      matchedOpportunity = opp;
      break;
    }
  }

  // 2. Fallback heuristic regex check for federal solicitation pattern
  if (!matchedOpportunity) {
    const federalSolPattern = /\b([A-Z0-9]{4,6}-[0-9]{2,4}-[A-Z0-9]-[0-9A-Z]{3,6}|36C[0-9A-Z]{5,10}|W[0-9A-Z]{10,14}|N[0-9A-Z]{10,14}|FA[0-9A-Z]{8,12})\b/gi;
    const matches = combinedContent.match(federalSolPattern);

    if (matches && matches.length > 0) {
      for (const extractedSol of matches) {
        const found = await db
          .select({
            id: opportunities.id,
            solicitationNumber: opportunities.solicitationNumber,
          })
          .from(opportunities)
          .where(
            or(
              eq(opportunities.solicitationNumber, extractedSol),
              sql`lower(${opportunities.solicitationNumber}) = lower(${extractedSol})`
            )
          )
          .limit(1);

        if (found.length > 0) {
          matchedOpportunity = found[0];
          break;
        }
      }
    }
  }

  if (!matchedOpportunity) {
    console.log("[Email Handler] No matching solicitation number or opportunity notice found for email.");
    return {
      matched: false,
      messageId,
      notesLogged: 0,
      attachmentsSaved: 0,
    };
  }

  console.log(
    `[Email Handler] Matched opportunity ${matchedOpportunity.id} (Solicitation: ${matchedOpportunity.solicitationNumber})`
  );

  // Archive email text and attachments into R2 under emails/${opportunity_id}/${messageId}/
  const preparedAttachments = (parsed.attachments || []).map((att) => ({
    filename: att.filename || "unnamed_attachment",
    content: att.content,
    mimeType: att.mimeType || "application/octet-stream",
  }));

  const r2EmailPrefix = await storage.archiveEmail(matchedOpportunity.id, messageId, {
    rawEml: rawBuffer,
    text: bodyText,
    html: bodyHtml,
    attachments: preparedAttachments,
  });

  // Log note into opportunity_notes linked to that opportunity
  const noteId = crypto.randomUUID();
  const senderEmail = parsed.from?.address || message.from;
  const senderName = parsed.from?.name ? `${parsed.from.name} <${senderEmail}>` : senderEmail;

  await db.insert(opportunityNotes).values({
    id: noteId,
    opportunityId: matchedOpportunity.id,
    authorEmail: senderName,
    subject: subject || "Contracting Officer Correspondence",
    content: bodyText || (bodyHtml ? "Received HTML-formatted email message." : "No body text provided."),
    source: "email",
    r2EmailPrefix,
  });

  // Record attachments in opportunity_attachments
  let attachmentsSaved = 0;
  for (const att of preparedAttachments) {
    const attachmentId = crypto.randomUUID();
    const attR2Key = `${r2EmailPrefix}/attachments/${att.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    await db.insert(opportunityAttachments).values({
      id: attachmentId,
      opportunityId: matchedOpportunity.id,
      filename: att.filename,
      r2Key: attR2Key,
      contentType: att.mimeType,
      parsedText: null,
    });
    attachmentsSaved++;
  }

  return {
    matched: true,
    opportunityId: matchedOpportunity.id,
    solicitationNumber: matchedOpportunity.solicitationNumber || undefined,
    notesLogged: 1,
    attachmentsSaved,
    messageId,
  };
}
