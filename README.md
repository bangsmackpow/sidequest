# Sidequest: SAM.gov SDVOSB Capture & Proposal Management Platform

A multi-user, multi-tenant federal contracting capture engine and opportunity pipeline tailored for Service-Disabled Veteran-Owned Small Businesses (SDVOSB). The system continuously polls SAM.gov Opportunities APIs, flags high-priority RFIs/Sources Sought and Simplified Acquisition Threshold opportunities, stores attachments in Cloudflare R2, parses incoming contracting officer emails via Cloudflare Email Routing, and accelerates the proposal lifecycle.

---

## 🏛 System Architecture & Stack

- **Runtime & Hosting:** Cloudflare Workers & Cloudflare Pages (HONC full-stack pattern)
- **Web Framework:** [Hono](https://hono.dev)
- **Database:** Cloudflare D1 (SQLite) with [Drizzle ORM](https://orm.drizzle.team)
- **Object Storage:** Cloudflare R2 (for raw solicitation JSON, PDFs, SOWs, email archives, and generated capability statements)
- **Caching & State:** Cloudflare KV (for cron watermarks, rate-limit counters, and fast token lookups)
- **Authentication:** Better Auth with D1 Drizzle Adapter, supporting multi-tenant organizations and role-based access control (`admin`, `manager`, `member`)
- **Email:** Cloudflare Email Routing (Inbound Worker `email` handler with `postal-mime`) + Transactional Outbound Dispatcher

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Cloudflare Edge Network                         │
├──────────────────┬──────────────────────┬──────────────────────────────┤
│  Scheduled Cron  │  Email Routing       │  HTTP / Web / API            │
│  (*/30 * * * *)  │  (CO Inbound MIME)   │  (Hono + Better Auth + UI)   │
└────────┬─────────┴──────────┬───────────┴──────────────┬───────────────┘
         │                    │                          │
         ▼                    ▼                          ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐
│  SAM.gov Search  │ │   Postal-Mime    │ │  SDVOSB Kanban Board         │
│  API Poller      │ │   Email Parser   │ │  Section L RFI Generator     │
└────────┬─────────┘ └────────┬─────────┘ └──────────────┬───────────────┘
         │                    │                          │
         └────────────────────┼──────────────────────────┘
                              │
     ┌────────────────────────┼────────────────────────┐
     ▼                        ▼                        ▼
┌──────────────┐      ┌──────────────┐         ┌──────────────┐
│  D1 SQLite   │      │  R2 Storage  │         │  KV State    │
│  (Metadata)  │      │  (Artifacts) │         │  (Sync Sync) │
└──────────────┘      └──────────────┘         └──────────────┘
```

---

## 🗄 Database Schema (`src/db/schema.ts`)

1. **Authentication & Multi-Tenancy:**
   - `users`: User identity and email verification.
   - `sessions`: Session tracking with `activeOrganizationId`.
   - `accounts`: OAuth and credential storage.
   - `verifications`: Nonce and verification tokens.
   - `organizations`: Multi-tenant organization records.
   - `members`: Tenancy memberships with custom roles (`admin`, `manager`, `member`).
   - `invitations`: Team invitations and role assignment.
2. **`saved_search_profiles`:**
   - Organization-specific NAICS codes, set-aside types (`SDVOSBC`, `VOSBC`), notice types (`r` for Sources Sought, `o` for Solicitations), and Simplified Acquisition Threshold bounds ($250,000).
3. **`opportunities`:**
   - Synced SAM.gov notice records with noticeId, solicitation number, title, agency, sub-tier, office, deadlines, NAICS, and pipeline status (`new`, `reviewing_sow`, `drafting_rfi`, `submitted`, `won`, `lost`, `archived`).
4. **`opportunity_attachments`:**
   - Files, SOWs, and generated proposals linked to R2 object keys.
5. **`capability_statements`:**
   - Corporate UEI, CAGE code, SBA VetCert SDVOSB certification status, core competencies, and past performance matrices.
6. **`opportunity_notes`:**
   - Manual capture team notes and automatically parsed emails from Contracting Officers.
7. **`opportunity_alerts`:**
   - High-priority audit trail generated when newly polled opportunities match active search profiles.

---

## ⚡ Core Engine Components

### 1. Worker Ingestion Engine (`src/workers/ingest.ts`)
- Automatically polled every 30 minutes via Cloudflare Cron (`triggers.crons: ["*/30 * * * *"]`).
- Reads the last synchronization watermark from KV (`sam_last_sync_timestamp`), defaulting to the past 24 hours.
- Queries `https://api.sam.gov/opportunities/v2/search` with `typeOfSetAside=SDVOSBC` and `ptype=r,o`.
- Transparently paginates when `totalRecords > 100`.
- Archives raw payload JSON into R2 at `raw/opportunities/${noticeId}.json`.
- Upserts metadata records into D1 `opportunities` using `onConflictDoUpdate` without overwriting active pipeline progress.
- Cross-references opportunities with `saved_search_profiles` and creates alert records for high-priority matches.

### 2. Inbound Email Handler (`src/workers/email.ts`)
- Native Cloudflare `email` worker handler for `<prefix>@domain.com`.
- Extracts raw MIME stream and parses headers, body, and attachments using `postal-mime`.
- Detects federal solicitation numbers or active opportunity notice IDs in subject/body.
- Archives email text, HTML, and attachments to R2 under `emails/${opportunity_id}/${messageId}/`.
- Automatically logs a correspondence note into `opportunity_notes` with download links to attachments.

### 3. RFI Response & Section L Capabilities Generator (`src/services/rfi-generator.ts`)
- Generates compliant Sources Sought / RFI capability narratives tailored to Section L instructions.
- Auto-injects company UEI, CAGE code, SBA VetCert SDVOSB verification status, and **FAR 52.219-27 / 13 CFR § 125.6** subcontracting limitation attestations.
- Formats executive summaries, core competencies, staffing models, and past performance matrices.
- Archives the generated proposal document into Cloudflare R2 (`proposals/${oppId}/...`) and updates the opportunity status to `drafting_rfi`.

### 4. Interactive GovTech UI (`src/ui/pages.ts`)
- Modern dark-mode GovTech interface styled with Tailwind CSS.
- **Kanban Pipeline Board:** [New Notices] ➔ [Reviewing SOW] ➔ [Drafting RFI] ➔ [Submitted] ➔ [Won / Awarded].
- Instant filtering by NAICS code, set-aside code, and keyword search.
- One-click SAM.gov polling trigger with real-time sync metrics.
- Modals for Opportunity Details, Contracting Officer correspondence, Search Profiles, and SDVOSB Credentials.

---

## 🚀 Setup & Local Development

### 1. Prerequisites
- Node.js (v20+ recommended)
- `pnpm` (or `npm`)
- Wrangler CLI (`pnpm add -g wrangler`)

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Initialize Local D1 Database
Apply the Drizzle SQL migrations locally:
```bash
pnpm run db:migrate
```

### 4. Run Development Server
```bash
pnpm run dev
```
Open [http://localhost:8787](http://localhost:8787) in your browser.

### 5. Run Automated Tests
```bash
pnpm test
```

---

## 📡 API Reference (`/api/v1`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api/v1/stats` | Capture pipeline metrics & sync timestamp |
| `GET` | `/api/v1/opportunities` | List & filter opportunities (`naics`, `set_aside`, `status`, `q`) |
| `GET` | `/api/v1/opportunities/:id` | Full opportunity details, attachments, notes, and alerts |
| `PATCH` | `/api/v1/opportunities/:id/status` | Transition opportunity status along the pipeline |
| `POST` | `/api/v1/opportunities/:id/generate-rfi` | Inject SDVOSB credentials and generate Section L RFI |
| `GET` | `/api/v1/opportunities/:id/attachments/:attachmentId/download` | Stream attachment directly from Cloudflare R2 |
| `POST` | `/api/v1/opportunities/:id/notes` | Add manual capture note |
| `GET` | `/api/v1/saved-search-profiles` | List saved search & alert profiles |
| `POST` | `/api/v1/saved-search-profiles` | Create or update search profile |
| `GET` | `/api/v1/capability-statements` | List corporate SDVOSB capability statements |
| `POST` | `/api/v1/capability-statements` | Store corporate capability statement |
| `POST` | `/api/v1/ingest/run` | Manually trigger SAM.gov synchronization |
| `POST` | `/api/v1/email/simulate` | Test inbound email parsing and R2 archiving |

---

## 🔒 Configuration & Secrets

Configure the following secrets in Cloudflare Workers using Wrangler:

```bash
# SAM.gov API Key (from https://sam.gov/content/developer-portal)
npx wrangler secret put SAM_GOV_API_KEY

# Better Auth Secret (random 32+ character hex string)
npx wrangler secret put BETTER_AUTH_SECRET

# Application Base URL
npx wrangler secret put BETTER_AUTH_URL
```

---

## 📦 Cloudflare Deployment

Deploy to Cloudflare Workers & D1 remote instance:

```bash
# 1. Apply D1 migrations to remote database
pnpm run db:migrate:remote

# 2. Deploy worker
pnpm run deploy
```

Continuous integration and deployment is automatically triggered via GitHub commits (`agy --> github --> Cloudflare Pages / Workers`).  
Repository: [https://github.com/bangsmackpow/sidequest.git](https://github.com/bangsmackpow/sidequest.git)
