import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types/env";
import { apiRouter } from "./routes/api";
import { authRouter } from "./routes/auth";
import { renderAppLayout, renderKanbanBoard } from "./ui/pages";
import { runSamIngestion } from "./workers/ingest";
import { handleInboundEmail } from "./workers/email";

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use(
  "*",
  cors({
    origin: (origin) => origin || "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Dev-User-Id", "X-Dev-Role", "X-Dev-Org-Id"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    service: "sidequest-sdvosb-capture",
    runtime: "cloudflare-workers",
    timestamp: new Date().toISOString(),
  });
});

// Mount Better Auth routes
app.route("/api/auth", authRouter);

// Mount SDVOSB Capture API
app.route("/api/v1", apiRouter);

// Frontend UI: Kanban Pipeline Dashboard
app.get("/", (c) => {
  const html = renderAppLayout(renderKanbanBoard(), "SDVOSB Federal Pipeline");
  return c.html(html);
});

// 404 Handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `The requested path ${c.req.path} does not exist.`,
    },
    404
  );
});

// Global Error Handler
app.onError((err, c) => {
  console.error("[Unhandled App Error]:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message || "An unexpected error occurred.",
    },
    500
  );
});

// Export Worker interfaces: fetch, scheduled (cron), and email (Cloudflare Email Routing)
export default {
  fetch: app.fetch,

  /**
   * Cloudflare Cron Trigger (Runs every 30 minutes: Every 30 mins)
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Cron Trigger] Ingestion task started at ${new Date().toISOString()} (cron: ${event.cron})`);
    ctx.waitUntil(
      runSamIngestion(env).then((res) => {
        console.log(`[Cron Trigger] Ingestion completed. Notices: ${res.noticesProcessed}, Alerts: ${res.alertsCreated}`);
      })
    );
  },

  /**
   * Cloudflare Native Email Worker Handler
   */
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`[Email Handler] Inbound message received from ${message.from} to ${message.to}`);
    ctx.waitUntil(
      handleInboundEmail(message, env).then((res) => {
        console.log(`[Email Handler] Processed message ${res.messageId}. Matched Opp: ${res.opportunityId || "None"}`);
      })
    );
  },
};
