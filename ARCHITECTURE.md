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

The shadcn primitives stay in `src/components/ui/` (not `shared/ui/`) because the ESLint
ignore for vendored code lives in the protected `eslint.config.js`.

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
   │  ├─ client/              ← snapshot query + schema, useAction, ui prefs, i18n composition
   │  │  └─ layout/           ← app chrome: page shell, header, sidebar, command menu
   │  └─ server/              ← Node entry, Hono app, per-request context, snapshot, seed
   │     └─ api/              ← API integration tests (in-memory SQLite)
   ├─ features/
   │  └─ <feature>/
   │     ├─ index.ts(x)       ← browser surface: the page(s) routes render
   │     ├─ model/            ← Zod schemas + inferred types + pure logic (+ tests)
   │     ├─ api/              ← TanStack Query hooks (callApi → Zod parse)
   │     ├─ ui/               ← React components (presentation only)
   │     ├─ server/           ← *.table.ts · *.repo.ts · *.service.ts · *.routes.ts
   │     │  └─ index.ts       ← server surface (routes, loaders, services others call)
   │     └─ i18n/             ← ar.ts / en.ts for this feature's sections
   ├─ components/ui/          ← shadcn primitives (vendored, see §1)
   └─ shared/                 ← generic kernel (≥ 3 features, no business rules)
      ├─ components/ context/ hooks/ lib/ config/   ← generic UI + template helpers
      ├─ db/ http/ server/    ← Database type, ids, envelope, errors, validation, Ctx
      ├─ model/               ← isoDate, recordId, stripNulls/parseRows, date helpers
      ├─ money/               ← money quad, formatting, currency conversion
      └─ i18n/                ← app/nav/common/apiErrors strings, Lang helpers
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

1. `routes/` → a feature's `index.ts(x)` or its page in `ui/`, plus `app/client` loaders.
2. A feature imports another feature through its `index.ts`, its `server/index.ts`
   (server code only) or its **pure `model/` files** (the shared contract: schemas,
   types, selectors). Type-only imports may cross freely; runtime cycles are
   forbidden. Service dependency direction:
   `time/today/leads → engagements → invoices → clients · settings · rates · files`
   (e.g. billing extra retainer hours lives in `time` because it reads time entries).
3. `features/*` → `shared/*` allowed; `shared/*` → `features/*` and `app/*` forbidden.
4. `app/` may import every feature (it composes them). Features import from `app/`
   only `app/client/*` — the snapshot query, `useAction`, UI prefs, current member
   and the page shell — never `app/server/*`.
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

- **Reads:** one `GET /api/snapshot` returns every table the UI needs; the route
  loader (`_authenticated`, `/p/$token`) prefetches it, screens read it with `useDb()`
  (`app/client/snapshot-query.ts`, Zod-validated, retries while the API boots) and run
  the pure selectors. Data volume
  for 1–3 people is small; per-feature endpoints can replace this later without
  touching the UI (`api/` hooks are the only consumers).
- **Writes:** one endpoint per business action (issue invoice, bill overage,
  record payment, save daily rate…). Each runs in a single SQLite transaction
  and reuses the same pure `model/` logic as the client (the guard, numbering).
  Services receive a `Ctx` (`db` = the transaction, `today`, `now`, `memberId`) built
  per request by `app/server/context.ts`; a thrown `DomainError` rolls back and becomes
  a 4xx envelope. Client writes go through `useAction` (`app/client/use-action.ts`),
  which refetches the snapshot before `onSuccess` runs; failures show a translated
  toast (`apiErrors.<code>`).

| Feature | Endpoints (all under `/api`) |
|---|---|
| rates | `PUT /rates/today` |
| invoices | `POST /invoices` (manual, issued at once) · `POST /invoices/:id/payments` · `POST /invoices/:id/void` |
| engagements | `POST /engagements` · `PUT /engagements/:id` · `POST /deliverables/:id/{rounds,approval,bill-overage}` · `POST /engagements/:id/{scope,renew,grace,stop}` · `POST /stages/:id/toggle` |
| time | `POST /time` · `POST /engagements/:id/bill-hours` |
| leads | `POST /leads/:id/stage` (not to `won`) · `POST /leads/:id/convert` |
| today | `POST /tasks` · `/tasks/:id/toggle` · `/tasks/carry-over` · `PUT /reflections/today` · `POST /day/close` |
| clients | `POST /clients` · `PUT /clients/:id` · `POST /vault/:id/reveal` → 423 until phase 3 |
| finance | `POST /expenses` · `PUT /expenses/:id` · `DELETE /expenses/:id` |
| portal | owner: `POST`/`DELETE /engagements/:id/portal-link` · public (rate-limited): `GET /portal/:token` · `POST /portal/:token/deliverables/:id/{approval,rounds}` |
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
| 2026-09-25 | Client state: TanStack Query snapshot + per-action mutations; zustand only for UI prefs (display currency) | server data has one source of truth |
| 2026-09-25 | A lead becomes `won` only through conversion (client + engagement in one transaction), enforced by CHECK `lead_won_converted`; subscriptions require `grace_days` | database.md §3 constraints deferred from phase 1 |
| 2026-09-25 | End of day (`POST /day/close`) saves the reflection and carries tasks over atomically | both or neither |
| 2026-09-25 | Features may import `app/client/*` (snapshot, useAction, prefs, page shell); shared code uses the global `i18next` instance instead of importing app | the composed snapshot schema needs every feature, so it lives in app |
| 2026-09-25 | Issued invoices are never edited: they are voided with a reason (blocked once payments exist) and reissued | the number sequence and the record stay intact |
| 2026-09-25 | Voiding frees the revision rounds billed on it (billable again); renewal invoices can't be voided; a client link can't approve or request changes once a deliverable is approved | a void must not lose or double-bill work; undoing a renewal is its own flow |
| 2026-09-25 | Expenses snapshot the daily rate on create and keep it on edit unless the currency changes | a typo fix never revalues past spending |
| 2026-09-25 | Client portal links: 32-byte token, only its SHA-256 stored, shown once; one active link per engagement; the public view carries no money or contacts; per-IP limit keyed on `cf-connecting-ip` only (X-Forwarded-For is spoofable) | docs/database.md §3.6 |
| 2026-09-25 | Tests split into Vitest projects: `node` (API, models, money, http) and `browser` (DOM, Chromium) | the API needs SQLite/Node; components need a real browser |
| 2026-09-25 | Every API response uses `{ ok, data }` / `{ ok, error: { code, message } }` (`shared/http/envelope.ts`) | one envelope for all features |

## 6. Delivery phases & status

| Phase | Scope | Status |
|---|---|---|
| 0 | This document, line-budget check, `no-explicit-any` | **done** 2026-09-25 |
| 1 | Database: 24 Drizzle tables in their features, migration `0000_init`, demo seed (92 rows), `GET /api/snapshot`, round-trip test | **done** 2026-09-25 — write endpoints move to phase 2 with each feature's UI |
| 2 | Frontend on the API: write endpoints (tested), `mock/store` removed, `domain/` `mock/` `i18n/` `components/fos/` dissolved into slices, every file ≤ 250 lines, lead conversion + grace constraints | **done** 2026-09-25 |
| 2.5 | Create/edit: clients, engagements, expenses, manual invoices + void; token-scoped client portal (`client_portal_links`, migration `0001`) | **done** 2026-09-25 |
| 3 | Deferred tables & security: auth + roles (`auth_sessions`), encrypted vault, tickets, reminders log, message templates, calendar events, file uploads, backup | pending |

### Known gaps (next)

- Playwright Chromium: `npm run test:browser:install` can hang while unpacking on this
  machine; download and unzip the zips from `npx playwright install --dry-run chromium`
  by hand (plus an empty `INSTALLATION_COMPLETE` file in each folder).
- Owner endpoints are still unauthenticated (phase 3): e.g. `/deliverables/:id/approval`
  accepts `source: client_link`. Tighten once auth lands.
- No archive/delete for clients and engagements yet; no edit of engagement terms
  (amount, type) after opening; own subscriptions have no form yet.

## 7. Commands

| Command | What |
|---|---|
| `npm run dev` | Vite (5180) + API server (5181) together; the API applies pending migrations on start |
| `npm run db:generate` | generate a migration from the Drizzle tables |
| `npm run db:reset` | delete the local DB, migrate, load demo data |
| `npm run db:studio` | browse the database in Drizzle Studio |
| `npm run check:size` | enforce the 250-line budget |
| `npm test` · `npm run test:node` | all tests (node + Chromium) · node project only (no browser) |
| `npm run lint` · `npx tsc -b` | lint (incl. line budget) · type check |
