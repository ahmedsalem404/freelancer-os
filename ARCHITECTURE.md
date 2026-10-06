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
| `auth` | auth_sessions | Sign-in, sign-out button, "My account" panel (settings) |
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
| `my-day` | — (reads `GET /api/workspace`) | Assistant's whole app `/my-day`: own tasks, time, end-of-day note, account |

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
8. Every `/api` route needs a signed-in **owner** session except `/health`,
   `/auth/sign-in`, `/auth/sign-out` and the public `/portal/*`. Assistants reach only
   the `ANY_MEMBER` list in `app.ts` (`/auth/me`, `/auth/account`, `/workspace`, own
   tasks, time, end of day); the services keep them to their own rows
   (`today/server/assistant-scope.ts`). The gate lives in `app/server/app.ts` (`authGate`). The API still
   listens on `127.0.0.1` by default (`API_HOST`); the site is reached through Vite
   or a tunnel.

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
| auth | `POST /auth/sign-in` (rate-limited) · `POST /auth/sign-out` · `GET /auth/me` · `PUT /auth/account` (own name, login, password; needs the current password; rate-limited) · team (owner only): `POST /team` (new assistant + password) · `PUT /team/:id` · `PUT /team/:id/password` (signs them out everywhere) · `POST /team/:id/{deactivate,activate}` — never the owner row (`not_an_assistant`) |
| rates | `PUT /rates/today` |
| invoices | `POST /invoices` (manual, issued at once) · `POST /invoices/:id/payments` · `POST /invoices/:id/void` (on a renewal invoice this also undoes the renewal — `renewal_superseded` / `renewal_cycle_billed` when something was built on it) |
| engagements | `POST /engagements` · `PUT /engagements/:id` · `PUT /engagements/:id/terms` · `POST /engagements/:id/{archive,unarchive}` · `DELETE /engagements/:id` · `POST /deliverables/:id/{rounds,approval,bill-overage}` · `POST /engagements/:id/{scope,renew,grace,stop}` · `POST /stages/:id/toggle` |
| time | `POST /time` · `POST /engagements/:id/bill-hours` |
| leads | `POST /leads/:id/stage` (not to `won`) · `POST /leads/:id/convert` |
| today | `POST /tasks` (owner may set `assigneeId`) · `/tasks/:id/toggle` · `/tasks/carry-over` · `PUT /reflections/today` · `POST /day/close` |
| clients | `POST /clients` · `PUT /clients/:id` · `POST /clients/:id/{archive,unarchive}` · `DELETE /clients/:id` · vault (owner only): `POST /clients/:id/vault` · `PUT`/`DELETE /vault/:id` · `POST /vault/:id/reveal` (no-store) |
| files | owner only: `POST /files` (multipart: `file` + `kind` + one of `clientId`/`engagementId`/`paymentId` + `note`; ≤ 15 MB; type from the bytes: PDF, PNG, JPG, WEBP, GIF) · `GET /files/:id` (inline, `nosniff`, no-store) · `DELETE /files/:id` |
| templates | owner only: `PUT /templates/:key` (`{locale, body}`, upsert) · `DELETE /templates/:key/:locale` (back to the built-in text) |
| reminders | owner only: `POST /reminders` (`sent`/`dismissed`, idempotent on `kind:target:occurrence:offset`) — the pending list itself is derived (`reminders/model/schedule.ts`) |
| calendar | owner only: `POST`/`PUT`/`DELETE /calendar-events[/:id]` · `POST`/`PUT /important-dates[/:id]` · `POST /important-dates/:id/{handled,archive}` (handled rolls a recurring date forward) |
| backup | `GET /backup` (owner only) — zip of a `VACUUM INTO` copy of the database, `data/files/` and `data/vault.key` · `POST /backup/restore` (owner only, multipart `file`, ≤ 200 MB) — replaces all rows, `data/files/` and the vault key with the zip's; saves `data/backups/before-restore-<time>.zip` first and signs everyone out (`backup_invalid` for anything that isn't a backup) |
| finance | `POST /expenses` · `PUT /expenses/:id` · `DELETE /expenses/:id` · `POST /own-subscriptions` · `PUT /own-subscriptions/:id` · `POST /own-subscriptions/:id/renew` (records the period's charge as an expense on the renewal day and moves the renewal on; a period is charged once — `already_charged`) · `POST /own-subscriptions/:id/cancel` · `DELETE /own-subscriptions/:id` |
| workspace | `GET /workspace` — the signed-in member's own tasks (open + last 14 days), time (14 days), today's note and the titles of their tasks' engagements; no money |
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
| 2026-09-25 | Temporary deviations from database.md until phase 3: `vault_entries.username` plaintext + `ciphertext` nullable; `attachments` file metadata nullable; `team_members.password_hash` nullable; `leads` money quad NOT NULL (UI requires an estimate); deferred tables: `auth_sessions` (added in `0002`), `client_portal_links` (added in `0001`), `tickets`, `reminder_log`, `message_templates`, `calendar_events` | ship the database now without faking security features |
| 2026-09-25 | Client state: TanStack Query snapshot + per-action mutations; zustand only for UI prefs (display currency) | server data has one source of truth |
| 2026-09-25 | A lead becomes `won` only through conversion (client + engagement in one transaction), enforced by CHECK `lead_won_converted`; subscriptions require `grace_days` | database.md §3 constraints deferred from phase 1 |
| 2026-09-25 | End of day (`POST /day/close`) saves the reflection and carries tasks over atomically | both or neither |
| 2026-09-25 | Features may import `app/client/*` (snapshot, useAction, prefs, page shell); shared code uses the global `i18next` instance instead of importing app | the composed snapshot schema needs every feature, so it lives in app |
| 2026-09-25 | Issued invoices are never edited: they are voided with a reason (blocked once payments exist) and reissued | the number sequence and the record stay intact |
| 2026-09-25 | Voiding frees the revision rounds billed on it (billable again); renewal invoices can't be voided (superseded 2026-09-30); a client link can't approve or request changes once a deliverable is approved | a void must not lose or double-bill work; undoing a renewal is its own flow |
| 2026-09-25 | Archive hides, delete removes mistakes only: the snapshot keeps archived clients/engagements (`archivedAt`) and lists filter them; a hard delete relies on the foreign keys and answers 409 `*_in_use` for anything with records. Engagement type is fixed after opening; new terms reach the open cycle only while nothing bills it | history must always resolve; the DB already knows every reference |
| 2026-09-25 | Expenses snapshot the daily rate on create and keep it on edit unless the currency changes | a typo fix never revalues past spending |
| 2026-09-25 | Client portal links: 32-byte token, only its SHA-256 stored, shown once; one active link per engagement; the public view carries no money or contacts; per-IP limit keyed on `cf-connecting-ip` only (X-Forwarded-For is spoofable) | docs/database.md §3.6 |
| 2026-09-25 | Tests split into Vitest projects: `node` (API, models, money, http) and `browser` (DOM, Chromium) | the API needs SQLite/Node; components need a real browser |
| 2026-09-25 | Authentication: argon2id (Node's built-in `crypto.argon2`, no dependency) + server sessions in `auth_sessions` (SHA-256 of a 32-byte cookie token, 30-day sliding expiry). Cookie `fos_session`: HttpOnly, SameSite=Strict (the CSRF defence), Secure over HTTPS, Path=/api. Passwords are set from the terminal (`npm run auth:set-password`), never through a first-run web form | nobody who reaches the site first can claim the owner account |
| 2026-09-25 | The login is free text (an email or any name, unique case-insensitively; stored in `team_members.email`). Passwords: 4–200 characters, no complexity rules (owner's choice). Editing one's account needs the current password — no email codes | owner instruction: full freedom, no verification step |
| 2026-09-25 | Assistants get their own screen (`/my-day`) fed by `GET /api/workspace`, never the snapshot. They add/tick only their own tasks and log time only on engagements from their tasks; the owner assigns tasks from Today → Team tasks. Everything else answers 403. Signed-in endpoints never accept `source: client_link`; only the portal records it | the snapshot holds money and contacts |
| 2026-09-27 | Vault: AES-256-GCM per entry (12-byte nonce, AAD = row id, fresh nonce on every save); the key is 32 random bytes in `data/vault.key` (created on first save, mode 600). Signing in as the owner is enough to reveal — no second passphrase. Assistants never reach the vault routes or the snapshot. Supersedes database.md §3.2 "KDF(owner passphrase)" | owner decision: sign-in only, owner only |
| 2026-09-27 | Backup = one download in Settings (`GET /backup`): database + uploads + vault key in one zip. It opens the vault for whoever holds it, so the UI warns to keep it private. No restore button: restoring is replacing the `data/` folder while the server is stopped | owner decision: a button in Settings |
| 2026-09-27 | Uploads live at `data/files/<yyyy>/<id>.<ext>`; the path is built by the server, the type is sniffed from the first bytes (a renamed file is refused), the name is only a label. A payment's proof is uploaded right after the payment is saved (a failed upload never loses the payment) | database.md §1 Files |
| 2026-09-27 | Message templates: built-in Arabic/English texts in `settings/model/templates.ts`; `message_templates` stores only the owner's edits. Reminders: the schedule is derived from invoices (latest reached offset only), subscription cycles (`dueSoonDays` before the end), own subscriptions, important dates and lead follow-ups; `reminder_log` records each decision once. Migration `0003` adds `message_templates`, `reminder_log`, `calendar_events` | docs/database.md §3.1, §3.9 |
| 2026-09-30 | Undo a renewal = void its invoice (`invoices/server/undo-renewal.ts`): the cycle it opened is deleted and the renewed cycle reopens (`pending`, or `grace` if grace was granted). Refused once the new cycle is closed or another live invoice bills it. The voided renewal line is re-pointed at the reopened cycle so it stays on record | owner request; no second flow to learn |
| 2026-09-30 | Restore from backup in Settings (`POST /backup/restore`), replacing the 2026-09-27 "no restore button" decision. Checked before anything is touched (known zip entries only, fixed `files/<yyyy>/<id>.<ext>` paths, SQLite integrity, migrated to this version, has an owner); rows are swapped in one transaction on the live connection (`ATTACH`, foreign keys off, `foreign_key_check` before commit). Sessions are not restored: everyone signs in again with the passwords from the backup | owner request; a safety zip makes a wrong restore undoable |
| 2026-09-25 | Every API response uses `{ ok, data }` / `{ ok, error: { code, message } }` (`shared/http/envelope.ts`) | one envelope for all features |

## 6. Delivery phases & status

| Phase | Scope | Status |
|---|---|---|
| 0 | This document, line-budget check, `no-explicit-any` | **done** 2026-09-25 |
| 1 | Database: 24 Drizzle tables in their features, migration `0000_init`, demo seed (92 rows), `GET /api/snapshot`, round-trip test | **done** 2026-09-25 — write endpoints move to phase 2 with each feature's UI |
| 2 | Frontend on the API: write endpoints (tested), `mock/store` removed, `domain/` `mock/` `i18n/` `components/fos/` dissolved into slices, every file ≤ 250 lines, lead conversion + grace constraints | **done** 2026-09-25 |
| 2.5 | Create/edit: clients, engagements, expenses, manual invoices + void; token-scoped client portal (`client_portal_links`, migration `0001`) | **done** 2026-09-25 |
| 3 | Deferred tables & security: auth + roles (`auth_sessions`), encrypted vault, tickets, reminders log, message templates, calendar events, file uploads, backup | **in progress** — sign-in, sessions, roles, account settings, assistant `/my-day` done 2026-09-25 (migration `0002`) |

### Known gaps (next)

- Playwright Chromium: `npm run test:browser:install` can hang while unpacking on this
  machine; download and unzip the zips from `npx playwright install --dry-run chromium`
  by hand (plus an empty `INSTALLATION_COMPLETE` file in each folder).
- The owner's first password is set with `npm run auth:set-password -- <login>`; after that,
  Settings → My account. Assistants are added, renamed, given a new password and stopped
  or restarted from Settings → Team (a stopped member keeps their records).
- Retainer `tickets` (docs/database.md §3.5) have no table or screen yet: retainers are
  created with hours only, so nothing can reach the tickets unit today.
- Reminders are shown when the app is opened (Today); nothing is pushed while it is closed.

## 7. Commands

| Command | What |
|---|---|
| `npm run dev` | Vite (5180) + API server (5181) together; the API applies pending migrations on start |
| `npm run db:generate` | generate a migration from the Drizzle tables |
| `npm run db:reset` | delete the local DB, migrate, load demo data |
| `npm run db:studio` | browse the database in Drizzle Studio |
| `npm run auth:set-password -- <login>` | set a team member's password (hidden prompt) and sign them out everywhere |
| `npm run check:size` | enforce the 250-line budget |
| `npm test` · `npm run test:node` | all tests (node + Chromium) · node project only (no browser) |
| `npm run lint` · `npx tsc -b` | lint (incl. line budget) · type check |
