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

// PWA Web App Manifest
const pwaManifest = {
  id: "/",
  name: "Sidequest — SDVOSB Federal Capture Platform",
  short_name: "Sidequest",
  description: "SAM.gov SDVOSB Contract Capture, Compliance & Proposal Lifecycle Platform",
  start_url: "/",
  scope: "/",
  display: "standalone",
  orientation: "any",
  background_color: "#f8fafc",
  theme_color: "#d97706",
  categories: ["business", "productivity", "government"],
  icons: [
    {
      src: "/icon-192.svg",
      sizes: "192x192",
      type: "image/svg+xml",
      purpose: "any maskable",
    },
    {
      src: "/icon-512.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any maskable",
    },
  ],
};

app.get("/manifest.webmanifest", (c) => {
  return c.body(JSON.stringify(pwaManifest, null, 2), 200, {
    "Content-Type": "application/manifest+json; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});

app.get("/manifest.json", (c) => {
  return c.body(JSON.stringify(pwaManifest, null, 2), 200, {
    "Content-Type": "application/manifest+json; charset=utf-8",
    "Cache-Control": "public, max-age=3600",
  });
});

function renderAppIconSvg(size: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="url(#bg)"/>
  <path d="M${size * 0.5} ${size * 0.16} L${size * 0.78} ${size * 0.28} V${size * 0.52} C${size * 0.78} ${size * 0.7} ${size * 0.66} ${size * 0.81} ${size * 0.5} ${size * 0.86} C${size * 0.34} ${size * 0.81} ${size * 0.22} ${size * 0.7} ${size * 0.22} ${size * 0.52} V${size * 0.28} Z" fill="#0f172a"/>
  <polygon points="${size * 0.5},${size * 0.32} ${size * 0.55},${size * 0.44} ${size * 0.68},${size * 0.44} ${size * 0.58},${size * 0.52} ${size * 0.62},${size * 0.65} ${size * 0.5},${size * 0.57} ${size * 0.38},${size * 0.65} ${size * 0.42},${size * 0.52} ${size * 0.32},${size * 0.44} ${size * 0.45},${size * 0.44}" fill="#fbbf24"/>
</svg>`;
}

app.get("/icon-192.svg", (c) => {
  return c.body(renderAppIconSvg(192), 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  });
});

app.get("/icon-512.svg", (c) => {
  return c.body(renderAppIconSvg(512), 200, {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400",
  });
});

// PWA Service Worker
app.get("/sw.js", (c) => {
  const swScript = `const CACHE_NAME = 'sidequest-pwa-v2';
const CORE_ASSETS = ['/', '/manifest.webmanifest', '/icon-192.svg', '/icon-512.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/v1/opportunities') || url.pathname.startsWith('/api/v1/stats') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
`;
  return c.body(swScript, 200, {
    "Content-Type": "application/javascript; charset=utf-8",
    "Service-Worker-Allowed": "/",
    "Cache-Control": "no-cache",
  });
});

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
