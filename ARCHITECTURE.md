# Freelancer OS — Architecture

> Living document. Update it in the same change that adds a feature, moves a
> boundary or takes an architectural decision.
> Data model details live in [docs/database.md](docs/database.md).

## 1. Style: AI-first, feature-driven (vertical slices)

Code is grouped by **business feature**, never by technical layer. A feature
folder owns everything for its slice — UI, client API hooks, schemas/types,
pure business logic, server routes, database tables and tests — so one change
touches one folder.

### Non-negotiable rules

| Rule | Enforcement |
|---|---|
| Group by feature in `src/features/<feature>/` | review + this doc |
| `src/shared/` only for code reused by **≥ 3 features** and free of business rules | review |
| **≤ 250 lines per file** (code lines; blank lines and comments excluded); split at ~200 | `npm run check:size` (exit 1 on violation) |
| One primary component / hook / service per file; no kitchen-sink `utils.ts` | review |
| Zero `any` | ESLint `@typescript-eslint/no-explicit-any` (error, via `tseslint.configs.recommended`), `tsc --strict` |
| Every external boundary validated with **Zod** (HTTP input, HTTP responses on the client, forms, env, DB JSON columns) | schemas in `model/` |
| Components are presentation only; logic lives in pure functions (`model/`) or hooks (`api/`, `hooks/`) | review |

Exempt from the line budget (declared in `scripts/check-file-size.mjs`; `eslint.config.js`
is protected by a local hook, so the budget lives in that script): tests (`*.test.ts[x]`),
seed / demo data (`*.seed.ts`, `src/app/server/seed/**`), generated files
(`routeTree.gen.ts`, `drizzle/**`) and vendored shadcn primitives (`src/components/ui/**`).

## 2. Target directory tree

```
freelancer-os/
├─ ARCHITECTURE.md            ← this file
├─ docs/database.md           ← 30-table design, guard SQL, owner decisions
├─ drizzle.config.ts          ← collects every feature's *.table.ts
├─ drizzle/                   ← generated SQL migrations (never hand-edited)
├─ data/                      ← SQLite file + uploads (git-ignored, local only)
└─ src/
   ├─ main.tsx                ← browser entry
   ├─ routes/                 ← TanStack file routes: thin, import a feature page
   ├─ app/                    ← composition root: wires features, owns no business rules
   │  ├─ client/              ← providers, query client, snapshot hook, ui prefs
   │  └─ server/              ← Node entry, Hono app, DB connection, migrate, seed
   ├─ features/
   │  └─ <feature>/
   │     ├─ index.ts          ← public surface (the only import path for other features)
   │     ├─ model/            ← Zod schemas + inferred types + pure logic (+ tests)
   │     ├─ api/              ← TanStack Query hooks (fetch → Zod parse)
   │     ├─ ui/               ← React components (presentation only)
   │     ├─ server/           ← *.table.ts (Drizzle) · *.repo.ts · *.service.ts · *.routes.ts
   │     └─ i18n/             ← ar.ts / en.ts for this feature's strings
   └─ shared/                 ← generic kernel (≥ 3 features, no business rules)
      ├─ ui/                  ← shadcn primitives (vendored)
      ├─ components/ layout/ hooks/ context/ lib/
      └─ money/               ← money quad, formatting, currency conversion
```

### Features

| Feature | Owns (tables) | Screens |
|---|---|---|
| `settings` | settings, billing_identities, payment_methods, team_members | Settings |
| `rates` | exchange_rates (daily YER quotes) | header chip, settings panel |
| `clients` | clients, vault_entries | Clients list/detail |
| `leads` | leads | Leads kanban |
| `engagements` | engagements, engagement_cycles, engagement_stages, deliverables, review_rounds, approvals | Engagements list/detail, guard |
| `invoices` | invoices, invoice_items, payments | Invoice detail, payment dialog |
| `finance` | expenses, own_subscriptions | Finance overview |
| `time` | time_entries | Time |
| `today` | tasks, daily_reflections | Today, end-of-day |
| `calendar` | important_dates | Calendar (derived view) |
| `files` | attachments | attachment lists / upload |
| `pricing` | — (pure calculator) | Pricing |
| `portal` | — (reads engagements) | Public client link `/p/$token` |

## 3. Boundaries & dependency rules

1. `routes/` → `features/*/index.ts` only.
2. A feature imports another feature **only through its `index.ts`**. Type-only
   imports may cross freely; runtime cycles are forbidden.
3. `features/*` → `shared/*` allowed; `shared/*` → `features/*` forbidden.
4. `app/` may import every feature (it composes them); features never import `app/`.
5. Server code (`features/*/server/**`, `app/server/**`) is never imported by
   browser code. Shared between both: `model/` only (pure, no Node / DOM APIs).
6. Pure selectors take **only the tables they read** (e.g.
   `invoicePaid(db: { payments: Payment[] }, id)`) — no god `Db` type in features.
7. **Table files are the exception to rule 2:** `*.table.ts` import other
   features' table files by *relative path* (drizzle-kit loads them without the
   `@/` alias). FKs follow the dependency direction
   `settings → clients → engagements → invoices → files`; back-links
   (`engagement_cycles.renewal_invoice_id`, `deliverables/review_rounds.invoice_item_id`,
   `engagements.lead_id`) are plain ids checked in services, so table modules
   never import each other in a cycle.
8. The API listens on `127.0.0.1` only until authentication exists (phase 3).

## 4. Runtime architecture

```
Browser (React 19, Vite)                 Node (Hono)                     SQLite
─────────────────────────                ───────────────────────         ──────────────────
feature ui ─ api hook ── fetch /api/* ─▶ app/server/app.ts
                                           ├─ GET  /api/snapshot  ──▶ each feature repo ─▶ data/freelancer-os.db
                                           └─ POST /api/<feature>/… ─▶ feature service (Zod-validated,
                                                                        one transaction per business action)
```

- **Reads:** one `GET /api/snapshot` returns every table the UI needs; the client
  parses it with the composed Zod schema and runs the pure selectors. Data volume
  for 1–3 people is small; per-feature endpoints can replace this later without
  touching the UI (`api/` hooks are the only consumers).
- **Writes:** one endpoint per business action (issue invoice, bill overage,
  record payment, save daily rate…). Each runs in a single SQLite transaction
  and reuses the same pure `model/` logic as the client (the guard, numbering).
- **Derived values are never stored** (invoice status, balances, meters, health) —
  see docs/database.md §5.

## 5. Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-09-24 | SQLite (one local file) via Drizzle; portable to Postgres | free, zero-ops, one file to back up |
| 2026-09-25 | Vertical-slice architecture + 250-line budget adopted | owner instruction; small files are safer for AI-assisted edits |
| 2026-09-25 | **Daily exchange rate** quoted in YER (`1 SAR = x YER`, `1 USD = y YER`); prefills new records, each record still snapshots its rate. Supersedes database.md §7.1 "last typed rate" | owner instruction |
| 2026-09-25 | HTTP: **Hono** + `@hono/zod-validator`, run by `tsx` in dev; Vite proxies `/api` | tiny, typed, Zod-native |
| 2026-09-25 | Driver: **better-sqlite3** (synchronous, fastest, prebuilt Windows binaries) | no separate database server to install |
| 2026-09-25 | IDs for new rows: prefixed ULID (`inv_01J…`); seed keeps readable ids | sortable, readable in logs |
| 2026-09-25 | Reads through one snapshot endpoint; writes per business action | smallest change from the mock store; UI selectors reused |
| 2026-09-25 | Temporary deviations from database.md until phase 3: `vault_entries.username` plaintext + `ciphertext` nullable; `attachments` file metadata nullable; `team_members.password_hash` nullable; `leads` money quad NOT NULL (UI requires an estimate); deferred tables: `auth_sessions`, `client_portal_links`, `tickets`, `reminder_log`, `message_templates`, `calendar_events` | ship the database now without faking security features |
| 2026-09-25 | Every API response uses `{ ok, data }` / `{ ok, error: { code, message } }` (`shared/http/envelope.ts`) | one envelope for all features |

## 6. Delivery phases & status

| Phase | Scope | Status |
|---|---|---|
| 0 | This document, line-budget check, `no-explicit-any` | **done** 2026-09-25 |
| 1 | Database: 24 Drizzle tables in their features, migration `0000_init`, demo seed (92 rows), `GET /api/snapshot`, round-trip test | **done** 2026-09-25 — write endpoints move to phase 2 with each feature's UI |
| 2 | Frontend on the API: replace `src/mock/store.ts`, move code into feature slices, split files > 250 lines, per-feature i18n | pending |
| 3 | Deferred tables & security: auth + roles (`auth_sessions`), encrypted vault, client portal links, tickets, reminders log, message templates, calendar events, file uploads, backup | pending |

### Known violations (to clear in phase 2)

Files over 250 lines at adoption time: `mock/seed.ts` (808), `mock/store.ts` (510),
`i18n/en.ts` (431), `i18n/ar.ts` (425), `engagements/detail.tsx` (399),
`today/index.tsx` (365), `finance/index.tsx` (348), `engagements/panels.tsx` (340),
`invoices/detail.tsx` (327), `domain/selectors.ts` (325), `domain/types.ts` (306),
`components/fos/daily-rate.tsx` (277). Layer folders to dissolve: `domain/`,
`mock/`, `i18n/` (per-feature), `components/fos/` (→ features or `shared/`).

## 7. Commands

| Command | What |
|---|---|
| `npm run dev` | Vite (5180) + API server (5181) together; the API applies pending migrations on start |
| `npm run db:generate` | generate a migration from the Drizzle tables |
| `npm run db:reset` | delete the local DB, migrate, load demo data |
| `npm run db:studio` | browse the database in Drizzle Studio |
| `npm run check:size` | enforce the 250-line budget |
| `npx vitest run --browser.enabled=false src` | unit tests (node) |
| `npm run lint` · `npx tsc -b` | lint (incl. line budget) · type check |
