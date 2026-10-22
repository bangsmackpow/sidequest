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
- **Inbound Email:** Cloudflare Email Routing with `postal-mime` RFC 822 MIME parser.

```
src/
├── auth/                 # Better Auth initialization, auth middleware, and TOTP engine
│   ├── index.ts          # Better Auth instance with plugins (organization, bearer, twoFactor, admin)
│   ├── middleware.ts     # Session extraction, 3-day MFA grace enforcement, role guard
│   └── totp.ts           # Web Crypto RFC 6238 TOTP engine, Base32 encoder, and otpauth URI builder
├── db/                   # Database layer
│   ├── index.ts          # Drizzle client factory: createDb(env.DB)
│   ├── schema.ts         # Complete SQLite schema for Auth, SDVOSB pipeline, profiles, and R2 links
│   └── seed.ts           # Demo opportunities, search profiles, and seeded admin credentials
├── routes/               # Hono route handlers
│   ├── api.ts            # Core capture pipeline, stats, profiles, RFI generation, and seed endpoints
│   ├── auth-management.ts# Public auth, MFA setup/verify, password reset, and Admin Console CRUD
│   └── auth.ts           # Better Auth catch-all route handler (/api/auth/*)
├── services/             # Core business logic services
│   ├── rfi-generator.ts  # FAR 52.219-27 compliant Section L proposal generator
│   ├── sam-gov.ts        # SAM.gov Opportunities API poller with mock fallback
│   └── storage.ts        # Cloudflare R2 object storage streaming service
├── types/                # Environment bindings and type definitions
│   ├── env.ts            # Cloudflare Env bindings (DB, BUCKET, KV, secrets) and AuthContext
│   └── sam.ts            # SAM.gov API response interfaces
├── ui/                   # Frontend components
│   └── pages.ts          # Responsive GovTech Kanban board, modals, and client-side logic
└── workers/              # Cloudflare Worker event exports
    ├── email.ts          # Cloudflare Email Routing inbound handler (interception & R2 archiving)
    ├── ingest.ts         # Scheduled cron handler (polls SAM.gov every 30 mins)
    └── outbound-email.ts # Transactional outbound email dispatcher
```

---

## 2. Critical Edge Invariants & Constraints

When writing or modifying code in this repository, **you must observe the following rules**:

### A. Edge Runtime Compatibility (No Node.js Native Dependencies)
- Code runs inside Cloudflare Workers (`workerd`).
- **Never import Node.js native filesystem modules (`fs`, `node:fs`, `node:child_process`)** inside `src/`.
- Cryptographic operations must use the standard **Web Crypto API (`crypto.subtle`)**.
- `nodejs_compat` is enabled in `wrangler.jsonc` for selected shims (e.g. `Buffer`, `EventEmitter`).

### B. D1 SQLite & Migration Protocol
- Cloudflare D1 is SQLite. It does **not** support certain PostgreSQL or MySQL syntax (e.g., `RETURNING` in older runtimes, complex nested transactions).
- **Never execute destructive raw queries in migrations.**
- All migration files in `drizzle/*.sql` must be **idempotent**:
  - Use `CREATE TABLE IF NOT EXISTS` for all tables.
  - Wrap table alterations to guard against duplicate column errors.
- **D1 Migration Journaling (`d1_migrations`):**
  - Cloudflare CI runs `wrangler d1 migrations apply DB --remote`.
  - Wrangler checks D1's internal tracking table `d1_migrations`.
  - Always ensure migration files are applied using Wrangler migration commands rather than ad-hoc SQL execution to keep `d1_migrations` synchronized.

### C. Better Auth Drizzle Adapter Plural Mapping
- In `src/auth/index.ts`, Better Auth is configured with `usePlural: true`.
- It expects plural table names in schema mappings (`users`, `sessions`, `accounts`, `verifications`, `organizations`, `members`, `invitations`, `twoFactors`).
- Always supply both singular and plural aliases in `drizzleAdapter` schema options to prevent runtime resolution errors.

### D. UI Template String Escaping in `src/ui/pages.ts`
- `src/ui/pages.ts` returns the entire HTML and client-side `<script>` as a TypeScript template string (enclosed in backticks).
- **Any inner client-side template string and `${variable}` inside `<script>` blocks MUST BE ESCAPED as `\` and `\${variable}`.**
- Failure to escape client-side variables results in the outer TypeScript compiler trying to evaluate them during build, leading to syntax errors (`TransformError: Expected ";" but found "class"`).
- Always verify client scripts compile cleanly using the Node.js VM before pushing:
  ```bash
  node -e "import('./src/ui/pages.ts').then(m => { const s = m.renderAppLayout('', '').match(/<script>([\s\S]*?)<\/script>/)[1]; new (require('node:vm').Script)(s); console.log('OK'); })"
  ```

---

## 3. Security, Authentication & MFA Model

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

## 4. Verification & Testing Protocol

Before committing or pushing any code changes, **all of the following checks must pass**:

```bash
# 1. Run all unit & integration tests
pnpm test

# 2. Run TypeScript strict type-checking
pnpm build

# 3. Dry-run Wrangler bundle generation
pnpm exec wrangler deploy --dry-run
```

The test suite in [`tests/`](tests/) covers:
1. `tests/auth_and_admin.test.ts`: Password hashing/verification, TOTP generation & drift window, 3-day grace period logic, email regex validation, session token parsing.
2. `tests/totp.test.ts`: Base32 secret generation, RFC 6238 code generation, backup recovery codes, `otpauth` URI format.
3. `tests/pipeline.test.ts`: SAM.gov poller mock, date formatting, Section L RFI capability statement generation, SAT quote generation, past performance matrix.
4. `tests/email_and_api.test.ts`: Postal-Mime RFC 822 email parser, health check endpoint, Kanban UI HTML rendering.

---

## 5. CI/CD & Cloudflare Deployment

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
