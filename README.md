# Sidequest: SAM.gov SDVOSB Capture & Proposal Management Platform

[![Edge Runtime](https://img.shields.io/badge/Runtime-Cloudflare%20Workers-orange)](https://workers.cloudflare.com/)
[![Framework](https://img.shields.io/badge/Framework-Hono%20v4-blue)](https://hono.dev/)
[![Database](https://img.shields.io/badge/Database-Cloudflare%20D1%20SQLite-yellow)](https://developers.cloudflare.com/d1/)
[![ORM](https://img.shields.io/badge/ORM-Drizzle%20ORM-green)](https://orm.drizzle.team/)
[![Authentication](https://img.shields.io/badge/Auth-Better%20Auth%20%2B%20TOTP%20MFA-purple)](https://better-auth.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable%20%2B%20Offline%20Ready-emerald)](https://sidequest.curtislamasters.workers.dev/manifest.webmanifest)
[![Tests](https://img.shields.io/badge/Tests-21%2F21%20Passing-brightgreen)](tests/)

A multi-user, multi-tenant federal contracting capture engine, compliance suite, and proposal lifecycle platform built for **Service-Disabled Veteran-Owned Small Businesses (SDVOSB)**. Sidequest polls live SAM.gov Opportunities APIs across all 6 notice stages (`p,r,k,o,s,a`), spotlights **13 core target NAICS codes**, detects solicitation amendments and Rule-of-Two set-aside conversion targets, indexes attachments in Cloudflare R2, manages bidirectional Contracting Officer & OSDBU correspondence, validates **FAR 52.219-27 / 13 CFR § 125.6** subcontracting and Non-Manufacturer Rule (NMR) compliance, queries live USAspending.gov historical award intelligence, and automates 5 federal proposal templates.

- **Live Production URL:** [https://sidequest.curtislamasters.workers.dev](https://sidequest.curtislamasters.workers.dev)
- **Strategic Capture Playbook:** [`docs/SDVOSB_STRATEGIC_PLAYBOOK.md`](docs/SDVOSB_STRATEGIC_PLAYBOOK.md)
- **Developer & Agent Guide:** [`AGENTS.md`](AGENTS.md)
- **GitHub Repository:** [https://github.com/bangsmackpow/sidequest.git](https://github.com/bangsmackpow/sidequest.git)

---

## 🏛 System Architecture & Stack

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          Cloudflare Edge Network                           │
├──────────────────┬──────────────────────┬──────────────────────────────────┤
│  Scheduled Cron  │  Email Routing       │  HTTP / Web / PWA / REST API     │
│  (0 */6 * * *)   │  (KO Inbound MIME)   │  (Hono + Better Auth + Light UI) │
└────────┬─────────┴──────────┬───────────┴────────────────┬─────────────────┘
         │                    │                            │
         ▼                    ▼                            ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────────┐
│  SAM.gov v2 API  │ │   Postal-Mime    │ │  Kanban + 13 Target NAICS Focus  │
│  6-Stage Poller  │ │   Email Parser   │ │  50% LoS Calc + Proposal Studio  │
└────────┬─────────┘ └────────┬─────────┘ └────────────────┬─────────────────┘
         │                    │                            │
         └────────────────────┼────────────────────────────┘
                              │
     ┌────────────────────────┼────────────────────────────┐
     ▼                        ▼                            ▼
┌──────────────┐      ┌──────────────┐             ┌──────────────┐
│  D1 SQLite   │      │  R2 Storage  │             │  KV State    │
│  (Metadata)  │      │  (Artifacts) │             │  (Sync Sync) │
└──────────────┘      └──────────────┘             └──────────────┘
```

- **Runtime & Hosting:** Cloudflare Workers (HONC full-stack pattern).
- **Web Framework:** [Hono v4](https://hono.dev) with typed bindings and context variables.
- **Database:** Cloudflare D1 (SQLite) with [Drizzle ORM](https://orm.drizzle.team) and automated migrations.
- **Object Storage:** Cloudflare R2 (`sidequest-attachments`) for raw SAM.gov JSON payloads, solicitation attachments, SOWs, email archives, and generated proposal documents.
- **Caching & KV:** Cloudflare KV (`sidequest-kv`) for polling watermarks and fast session lookups.
- **Authentication:** [Better Auth](https://better-auth.com) with D1 Drizzle adapter, multi-tenant organizations, and role-based access control (`admin`, `manager`, `member`).
- **MFA / TOTP:** Native RFC 6238 Web Crypto TOTP engine with Base32 secrets, standard `otpauth://` QR URI generation, backup codes, and a strict 3-day grace period enforcement.
- **Progressive Web App (PWA) & Theme Engine:** Installable standalone PWA (`/manifest.webmanifest`, `/sw.js`, `/favicon.ico`, `/favicon.svg`) with **Light Mode by default** and a persistent **Dark Mode** toggle stored in `localStorage`.

---

## 🎯 Priority Target NAICS Capture Focus (13 Core Codes)

Sidequest places your **13 target NAICS codes** front-and-center in a dedicated quick-filter bar above the Kanban pipeline, with 1-click filtering (`★ 13 Target NAICS`), live match badges, and targeted 30-to-60-day SAM.gov polling:

| NAICS Code | Industry Label | Official NAICS Title |
| :--- | :--- | :--- |
| **`541519`** | IT Services / VAR | Other Computer Related Services |
| **`423430`** | Computer & SW Wholesale | Computer and Computer Peripheral Equipment and Software Merchant Wholesalers |
| **`513210`** | Software Publishers | Software Publishers |
| **`334111`** | Electronic Computers | Electronic Computer Manufacturing |
| **`423840`** | Industrial Supplies | Industrial Supplies Merchant Wholesalers |
| **`423450`** | Medical & Hospital Equip | Medical, Dental, and Hospital Equipment and Supplies Merchant Wholesalers |
| **`423490`** | Prof. Equipment & Supplies | Other Professional Equipment and Supplies Merchant Wholesalers |
| **`339940`** | Office Supplies Mfg | Office Supplies (except Paper) Manufacturing |
| **`541512`** | Systems Design | Computer Systems Design Services |
| **`541511`** | Custom Programming | Custom Computer Programming Services |
| **`541330`** | Engineering Services | Engineering Services |
| **`541611`** | Management Consulting | Administrative Management and General Management Consulting Services |
| **`541690`** | Tech Consulting | Other Scientific and Technical Consulting Services |

---

## ⚡ Core Capture, Compliance & Intelligence Features

### 1. Full 6-Stage SAM.gov Ingestion & Amendment Engine (`src/workers/ingest.ts`)
- Automatically polls `https://api.sam.gov/opportunities/v2/search` every 6 hours (`0 */6 * * *`) or on demand via **Poll SAM.gov** (`POST /api/v1/ingest/run`).
- Tracks all 6 procurement lifecycle notice types:
  - `p` — Presolicitation
  - `r` — Sources Sought / RFI (including **Rule-of-Two Set-Aside Flip** candidates)
  - `k` — Combined Synopsis/Solicitation (Fast-Track SAT RFQs)
  - `o` — Solicitation / RFP / IFB
  - `s` — Special Notice / Sole Source Intent (`FAR 19.1406`)
  - `a` — Award Notice (badged as `🏆 Market Award (Competitor)` for subcontracting & recompete intelligence)
- **Strict Personal Pipeline Hygiene:** All newly ingested SAM.gov notices start in **New Notices (`new`)**, ensuring **Reviewing SOW**, **Drafting RFI**, **Submitted**, and **My Won Contracts** only contain opportunities you personally advance.
- **Hierarchy & Contact Decoding:** Automatically parses SAM.gov v2 `fullParentPathName` into Department, Sub-Tier, and Contracting Office hierarchies and extracts verified Contracting Officer points of contact.
- **Solicitation Amendment Diffing:** Detects deadline extensions, set-aside code flips, and notice stage transitions, logging automated `amendment` alerts.

### 2. Bidirectional Contracting Officer & OSDBU Communications
- **Inbound Email Interception (`src/workers/email.ts`):** Parses RFC 822 MIME streams via `postal-mime`, matches solicitation numbers, archives attachments to R2, and logs correspondence to `opportunity_notes`.
- **Outbound KO & OSDBU Email Dispatch (`POST /api/v1/opportunities/:id/send-email`):** Compose and send formal emails (Capability Statements, Rule-of-Two Set-Aside Requests, Solicitation Q&A) directly to the Procuring Contracting Officer (KO) or Agency OSDBU from inside any Opportunity Detail modal, with automatic audit logging.
- **KO & OSDBU Contact Registry (`GET /api/v1/contacts`):** Searchable directory of federal Contracting Officers and Specialists extracted from live SAM.gov notices.

### 3. FAR 52.219-27 Limitations on Subcontracting (50% Rule) & NMR Calculator (`src/services/compliance-and-intel.ts`)
- **Interactive 50% Subcontracting Calculator (`POST /api/v1/compliance/calculate-los`):**
  - Computes net services/supply cost, **Prime SDVOSB + Similarly Situated Entity (SSE)** combined share (`13 CFR § 125.6`), and non-SDVOSB subcontractor share against statutory ceilings (`50%` for Services/Supplies, `85%` for General Construction, `75%` for Specialty Trade).
  - Flags illegal pass-through structures (`> 50%` non-SSE subcontracting) and calculates the exact dollar adjustment required to achieve compliance.
- **SBA Non-Manufacturer Rule (NMR) Waiver Checker (`POST /api/v1/compliance/check-nmr`):**
  - Evaluates hardware, IT VAR, medical, and supply NAICS codes (`334111`, `541519`, `423430`, `423450`, etc.) for SBA Class Waivers, domestic small-business manufacturer requirements, and `< $250,000` SAT strategies.

### 4. USAspending.gov Historical Award & Incumbent Intelligence
- **Live Federal Award Lookup (`GET /api/v1/opportunities/:id/award-intel`):**
  - Queries the public **USAspending.gov v2 API** by NAICS code and agency to surface recent awardees, award amounts, contract numbers, and action dates alongside local SAM.gov Award Notice intelligence.

### 5. 5-Template Proposal Studio (`src/services/rfi-generator.ts`)
Generates tailored, Markdown-formatted capture documents archived in Cloudflare R2:
1. **`capability_statement`:** Section L Compliant Sources Sought / RFI Capability Statement
2. **`sat_quote`:** Simplified Acquisition Threshold (`< $250k`) Fast-Track Commercial Quote (`FAR Part 13`)
3. **`past_performance`:** Past Performance Relevancy & CPARS Matrix (`Section M`)
4. **`rule_of_two_shaping`:** Rule-of-Two Set-Aside Conversion & `Kingdomware` (`38 U.S.C. § 8127(d)`) Request Letter
5. **`rfp_qa_inquiries`:** Formal Solicitation Q&A & Industry Inquiry Matrix

### 6. Laptop-Optimized UI, Light/Dark Theme & PWA (`src/ui/pages.ts`, `src/index.ts`)
- **Decluttered Top Bar (`max-w-[1600px]`):** Designed to fit comfortably on 15.6" laptop screens (such as Lenovo ThinkPad T15 at 125%–150% scaling) with inline pipeline KPI counters and a consolidated **Capture Tools ▾** menu.
- **Light Mode Default + Dark Mode Memory:** Renders in a high-contrast daylight-readable **Light Mode** by default with a 1-click **Dark / Light** toggle remembered in `localStorage`.
- **Full PWA & Favicon Support:** Includes `/manifest.webmanifest`, `/sw.js` service worker, `/icon-192.svg`, `/icon-512.svg`, `/favicon.ico`, and `/favicon.svg`.

---

## 🔐 Authentication, MFA & Access Control

### Initial Administrator Account
- **Email:** `admin@sdvosb-proposals.mil`
- **Initial Password:** `AdminSDVOSB!2026#Secure`
- **Role:** `admin` (Platform Administrator)

### Multi-Factor Authentication (MFA / TOTP) & 3-Day Grace Period
- Edge-native RFC 6238 TOTP implementation in [`src/auth/totp.ts`](src/auth/totp.ts) using `crypto.subtle`.
- **Days 0–3:** Users can operate within a 3-day grace window with a dismissible reminder banner.
- **After Day 3:** If `twoFactorEnabled === false`, all write/mutation requests return `403 MFA_REQUIRED` until 2FA is enabled.

---

## 📡 API Reference

### Public & Authenticated Auth Endpoints (`/api/v1/auth/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/sign-in` | Authenticate with email, password, and optional 6-digit TOTP code |
| `POST` | `/api/v1/auth/sign-out` | Purge session from D1, invalidate session cookies, and log out |
| `POST` | `/api/v1/auth/forgot-password` | Generate verification token and dispatch password reset link |
| `POST` | `/api/v1/auth/reset-password` | Verify reset token and update password hash |
| `GET` | `/api/v1/auth/me` | Current profile, active role, and MFA compliance / grace status |
| `POST` | `/api/v1/auth/mfa/generate` | Generate TOTP Base32 secret, QR URI, and backup codes |
| `POST` | `/api/v1/auth/mfa/enable` | Verify 6-digit code from authenticator app and activate 2FA |
| `POST` | `/api/v1/auth/mfa/disable` | Verify account password and disable 2FA |
| `POST` | `/api/v1/auth/change-password` | Validate current password and set new password |

### Admin Console Endpoints (`/api/v1/admin/users/*` - Requires `admin` role)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/admin/users` | List all users with roles, account ages, and MFA compliance states |
| `POST` | `/api/v1/admin/users` | Create new user with assigned role and temporary password |
| `PATCH` | `/api/v1/admin/users/:id` | Update user display name, email address, or role |
| `POST` | `/api/v1/admin/users/:id/reset-password` | Generate new temporary password for user |
| `POST` | `/api/v1/admin/users/:id/reset-mfa` | Reset MFA enrollment for locked-out user |
| `DELETE` | `/api/v1/admin/users/:id` | Permanently delete user account and revoke sessions |

### Capture, Compliance, Intelligence & Pipeline Endpoints (`/api/v1/*`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint |
| `GET` | `/api/v1/stats` | Pipeline metrics and SAM.gov sync watermark |
| `GET` | `/api/v1/opportunities` | List & filter opportunities (`naics`, `set_aside`, `status`, `q`) |
| `GET` | `/api/v1/opportunities/:id` | Opportunity details, attachments, notes, and alerts |
| `PATCH` | `/api/v1/opportunities/:id/status` | Transition opportunity status along the pipeline |
| `POST` | `/api/v1/opportunities/:id/generate-rfi` | Generate Section L RFI, SAT Quote, Past Perf, Rule-of-Two, or Q&A |
| `POST` | `/api/v1/opportunities/:id/send-email` | Dispatch outbound email to KO or OSDBU and log to audit trail |
| `GET` | `/api/v1/opportunities/:id/award-intel` | Fetch USAspending.gov & SAM.gov historical award intelligence |
| `GET` | `/api/v1/contacts` | List extracted Contracting Officer & OSDBU contacts across solicitations |
| `POST` | `/api/v1/compliance/calculate-los` | Calculate FAR 52.219-27 / 13 CFR § 125.6 50% subcontracting compliance |
| `POST` | `/api/v1/compliance/check-nmr` | Check SBA Non-Manufacturer Rule (NMR) waivers and exemptions |
| `GET` | `/api/v1/saved-search-profiles` | List saved search & alert profiles |
| `POST` | `/api/v1/saved-search-profiles` | Create or update search profile |
| `GET` | `/api/v1/capability-statements` | List corporate SDVOSB capability statements |
| `POST` | `/api/v1/capability-statements` | Store corporate capability statement |
| `POST` | `/api/v1/ingest/run` | Poll live SAM.gov API (`lookbackDays`, optional `naicsCode`) |
| `POST` | `/api/v1/seed/purge` | Purge demo records, reset live notices to `new`, and sync 13 target NAICS |
| `POST` | `/api/v1/seed` | Seed demonstration opportunities, profiles, and admin credentials |

---

## 🚀 Setup, Verification & Deployment

```bash
# Install dependencies
pnpm install

# Run local D1 migrations
pnpm run db:migrate

# Run all 21 automated tests
pnpm test

# Run TypeScript strict type-checking
pnpm build

# Deploy to Cloudflare Workers
npx wrangler deploy
```
