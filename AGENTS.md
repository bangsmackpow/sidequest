# AGENTS.md — Agent & Developer Architecture Guide

This document is the authoritative engineering guide for autonomous coding agents, LLMs, and human engineers collaborating on the **Sidequest** federal capture platform.

---

## 1. System Philosophy & Architecture (HONC Full-Stack)

Sidequest is built on the **HONC** architecture pattern optimized for the Cloudflare edge:
- **Framework:** [Hono v4](https://hono.dev) — Ultra-fast, lightweight web framework designed for edge runtimes.
- **ORM:** [Drizzle ORM](https://orm.drizzle.team) — Zero-overhead TypeScript ORM with D1 SQLite adapter.
- **Database:** [Cloudflare D1](https://developers.cloudflare.com/d1/) — Serverless SQLite distributed at the edge.
- **Object Storage:** [Cloudflare R2](https://developers.cloudflare.com/r2/) — S3-compatible zero-egress object store.
- **Key-Value State:** [Cloudflare KV](https://developers.cloudflare.com/kv/) — Fast low-latency caching for cron synchronization watermarks.
- **Authentication:** [Better Auth](https://better-auth.com) with D1 Drizzle adapter, multi-tenant organizations, and RFC 6238 TOTP MFA.
- **Inbound & Outbound Email:** Cloudflare Email Routing with `postal-mime` RFC 822 MIME parser + transactional outbound Contracting Officer / OSDBU email dispatcher.
- **Progressive Web App (PWA):** Native Web App Manifest (`/manifest.webmanifest`), Service Worker (`/sw.js`), vector icons (`/icon-192.svg`, `/icon-512.svg`), and favicons (`/favicon.ico`, `/favicon.svg`).

```
src/
├── index.ts              # Hono application entry, PWA manifest/SW/favicon routes, Cron & Email exports
├── auth/                 # Better Auth initialization, auth middleware, and TOTP engine
│   ├── index.ts          # Better Auth instance with plugins (organization, bearer, twoFactor, admin)
│   ├── middleware.ts     # Session extraction, 3-day MFA grace enforcement, role guard
│   └── totp.ts           # Web Crypto RFC 6238 TOTP engine, Base32 encoder, and otpauth URI builder
├── db/                   # Database layer
│   ├── index.ts          # Drizzle client factory: createDb(env.DB)
│   ├── schema.ts         # Complete SQLite schema for Auth, SDVOSB pipeline, profiles, and R2 links
│   └── seed.ts           # Demo opportunities, search profiles, and seeded admin credentials
├── routes/               # Hono route handlers
│   ├── api.ts            # Core capture pipeline, compliance calc, award intel, KO outreach, purge/seed
│   ├── auth-management.ts# Public auth, MFA setup/verify, password reset, and Admin Console CRUD
│   └── auth.ts           # Better Auth catch-all route handler (/api/auth/*)
├── services/             # Core business logic services
│   ├── compliance-and-intel.ts # FAR 52.219-27 50% Subcontracting Calc, NMR Checker, USAspending Intel
│   ├── rfi-generator.ts  # 5-template Proposal Studio (Section L RFI, SAT Quote, Past Perf, Rule-of-Two, Q&A)
│   ├── sam-api.ts        # SAM.gov v2 API poller, 13 Priority NAICS registry, fullParentPathName parser
│   └── storage.ts        # Cloudflare R2 object storage streaming service
├── types/                # Environment bindings and type definitions
│   ├── env.ts            # Cloudflare Env bindings (DB, BUCKET, KV, secrets) and AuthContext
│   └── sam.ts            # SAM.gov API response interfaces
├── ui/                   # Frontend components
│   └── pages.ts          # Laptop-optimized GovTech Kanban board, Light/Dark themes, PWA, and modals
└── workers/              # Cloudflare Worker event exports
    ├── email.ts          # Cloudflare Email Routing inbound handler (interception & R2 archiving)
    ├── ingest.ts         # Scheduled cron handler (polls SAM.gov every 6 hours: 0 */6 * * *)
    └── outbound-email.ts # Transactional outbound email dispatcher (KO/OSDBU outreach & alert digests)
docs/
└── SDVOSB_STRATEGIC_PLAYBOOK.md # Strategic SDVOSB capture playbook & industry growth guide
```

---

## 2. Priority Target NAICS Capture Configuration

Sidequest prioritizes **13 core NAICS codes** defined in [`PRIORITY_NAICS_CODES`](src/services/sam-api.ts) and surfaced front-and-center in the Kanban filter bar:
1. `541519` — Other Computer Related Services (IT Services / VAR)
2. `423430` — Computer and Computer Peripheral Equipment and Software Merchant Wholesalers
3. `513210` — Software Publishers
4. `334111` — Electronic Computer Manufacturing
5. `423840` — Industrial Supplies Merchant Wholesalers
6. `423450` — Medical, Dental, and Hospital Equipment and Supplies Merchant Wholesalers
7. `423490` — Other Professional Equipment and Supplies Merchant Wholesalers
8. `339940` — Office Supplies (except Paper) Manufacturing
9. `541512` — Computer Systems Design Services
10. `541511` — Custom Computer Programming Services
11. `541330` — Engineering Services
12. `541611` — Administrative Management and General Management Consulting Services
13. `541690` — Other Scientific and Technical Consulting Services

---

## 3. Critical Edge Invariants & Constraints

When writing or modifying code in this repository, **you must observe the following rules**:

### A. Edge Runtime Compatibility (No Node.js Native Dependencies)
- Code runs inside Cloudflare Workers (`workerd`).
- **Never import Node.js native filesystem modules (`fs`, `node:fs`, `node:child_process`)** inside `src/`.
- Cryptographic operations must use the standard **Web Crypto API (`crypto.subtle`)**.
- `nodejs_compat` is enabled in `wrangler.jsonc` for selected shims (e.g. `Buffer`, `EventEmitter`).

### B. Live SAM.gov API Quota & Pipeline Hygiene
- When `SAM_GOV_API_KEY` is configured in the environment, [`SamGovClient.fetchOpportunities`](src/services/sam-api.ts) **must never inject mock data**, even if SAM.gov returns HTTP `429` (daily quota reached).
- Scheduled cron runs every 6 hours (`0 */6 * * *`) with a single 100-record batch (`maxSafetyPages = 1`) to preserve daily SAM.gov API quota for manual user-triggered polls (`POST /api/v1/ingest/run`).
- All newly ingested SAM.gov notices (including `Award Notice` postings) start in `status = "new"` (**New Notices**) so that **Reviewing SOW**, **Drafting RFI**, **Submitted**, and **My Won Contracts** remain 100% controlled by the user.

### C. D1 SQLite & Migration Protocol
- Cloudflare D1 is SQLite. It does **not** support certain PostgreSQL or MySQL syntax.
- **Never execute destructive raw queries in migrations.**
- All migration files in `drizzle/*.sql` must be **idempotent** (`CREATE TABLE IF NOT EXISTS`).
- Always ensure migration files are applied using Wrangler migration commands (`wrangler d1 migrations apply DB --remote`) to keep `d1_migrations` synchronized.

### D. Better Auth Drizzle Adapter Plural Mapping
- In `src/auth/index.ts`, Better Auth is configured with `usePlural: true`.
- Always supply both singular and plural aliases in `drizzleAdapter` schema options (`users`, `sessions`, `accounts`, `verifications`, `organizations`, `members`, `invitations`, `twoFactors`).

### E. UI Template String Escaping & Light/Dark Theme Invariants in `src/ui/pages.ts`
- `src/ui/pages.ts` returns the entire HTML and client-side `<script>` as a TypeScript template string (enclosed in backticks).
- **Any inner client-side template string and `${variable}` inside `<script>` blocks MUST BE ESCAPED as `\` and `\${variable}`.**
- The UI defaults to **Light Mode (`html.theme-light`)** with a persistent toggle to **Dark Mode (`html.theme-dark`)** stored in `localStorage.getItem("sidequest_theme")`.
- Always verify client scripts compile cleanly using the Node.js VM before pushing:
  ```bash
  node --import tsx -e "import('./src/ui/pages.ts').then(m => { const html = m.renderAppLayout(m.renderKanbanBoard()); const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]; const vm = require('node:vm'); scripts.forEach((s, i) => new vm.Script(s[1])); console.log('OK (' + scripts.length + ' script blocks validated)'); })"
  ```

---

## 4. Security, Authentication & MFA Model

### User & Credential Registry
- **Initial Administrator:** `admin@sdvosb-proposals.mil`
- **Default Password:** `AdminSDVOSB!2026#Secure`
- Passwords are encrypted using Better Auth's scrypt implementation (`hashPassword` from `better-auth/crypto`).

### RFC 6238 TOTP Engine (`src/auth/totp.ts`)
- Implemented purely with Web Crypto (`crypto.subtle`).
- Generates 160-bit Base32 secret keys and standard `otpauth://totp/...` URIs.
- TOTP verification allows a ±1 step (±30 second) clock drift window.
- Produces 8 one-time backup recovery codes stored as a JSON array in `two_factors.backup_codes`.

### 3-Day Grace Period Enforcement (`src/auth/middleware.ts`)
- Every user's account age is computed against their `createdAt` timestamp:
  `accountAge = Date.now() - createdAt`
- If `accountAge > 3 days (72 hours)` and `twoFactorEnabled === false`:
  - Read-only operations (`GET`) remain permitted.
  - All write/mutation requests (`POST`, `PUT`, `PATCH`, `DELETE`) return `403 MFA_REQUIRED`.
  - Authentication endpoints (`/api/v1/auth/*`) are exempt to permit enrolling in MFA or resetting passwords.

### Role-Based Access Control (RBAC)
- Roles: `admin`, `manager`, `member`.
- Guard admin endpoints using `requireRole(["admin"])`.
- Administrators can edit user names, emails, and roles (`PATCH /api/v1/admin/users/:id`), and reset passwords or MFA enrollments.

---

## 5. Verification & Testing Protocol

Before committing or pushing any code changes, **all of the following checks must pass**:

```bash
# 1. Run all unit & integration tests (21/21 passing)
pnpm test

# 2. Run TypeScript strict type-checking
pnpm build

# 3. Dry-run Wrangler bundle generation
pnpm exec wrangler deploy --dry-run
```

The test suite in [`tests/`](tests/) covers:
1. `tests/auth_and_admin.test.ts`: Password hashing/verification, TOTP generation & drift window, 3-day grace period logic, email regex validation, session token parsing.
2. `tests/totp.test.ts`: Base32 secret generation, RFC 6238 code generation, backup recovery codes, `otpauth` URI format.
3. `tests/pipeline.test.ts`: SAM.gov poller mock, date formatting, all 5 Proposal Studio templates (`capability_statement`, `sat_quote`, `past_performance`, `rule_of_two_shaping`, `rfp_qa_inquiries`), FAR 52.219-27 / 13 CFR § 125.6 Subcontracting Calculator, and SBA Non-Manufacturer Rule (NMR) waiver checker.
4. `tests/email_and_api.test.ts`: Postal-Mime RFC 822 email parser, health check endpoint, Kanban UI HTML rendering.

---

## 6. CI/CD & Cloudflare Deployment

- **Repository:** `https://github.com/bangsmackpow/sidequest.git`
- **Branch:** `main`
- **Cloudflare CI Build Command:**
  ```bash
  pnpm install && pnpm run db:migrate:remote && npx wrangler deploy
  ```
- **Build Container Configuration:**
  - `NODE_VERSION`: `22` (set via `.node-version` and `.nvmrc`)
  - `PNPM_VERSION`: `10`
  - Approved build scripts: `package.json` contains `"pnpm": { "onlyBuiltDependencies": ["esbuild", "workerd"] }` to ensure zero-warning installations in pnpm 10.
