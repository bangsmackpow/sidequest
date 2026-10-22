import { Env } from "../types/env";

export interface OutboundEmailPayload {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export class OutboundEmailDispatcher {
  constructor(private env: Env) {}

  /**
   * Dispatch transactional notification email
   */
  async send(payload: OutboundEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const from = this.env.OUTBOUND_EMAIL_FROM || "alerts@sidequest.contracting.internal";

    // If an external email provider key (e.g. Resend, Postmark, or SendGrid) is set
    if (this.env.OUTBOUND_EMAIL_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.env.OUTBOUND_EMAIL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: Array.isArray(payload.to) ? payload.to : [payload.to],
            subject: payload.subject,
            text: payload.text,
            html: payload.html || payload.text.replace(/\n/g, "<br/>"),
            reply_to: payload.replyTo,
          }),
        });

        if (res.ok) {
          const data = (await res.json()) as { id: string };
          return { success: true, messageId: data.id };
        } else {
          const err = await res.text();
          console.error("[Outbound Email] Provider dispatch error:", err);
          return { success: false, error: err };
        }
      } catch (e: any) {
        console.error("[Outbound Email] Exception:", e);
        return { success: false, error: e.message };
      }
    }

    // Default simulation / internal log for edge worker environments
    console.log(`[Outbound Email Dispatched] To: ${JSON.stringify(payload.to)} | Subject: "${payload.subject}"`);
    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
  }
}
