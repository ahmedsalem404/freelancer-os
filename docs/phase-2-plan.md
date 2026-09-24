# Phase 2 — frontend on the API (working plan)

> Working checklist for phase 2. ARCHITECTURE.md stays the source of truth;
> delete this file when phase 2 is done.

## Steps

1. [ ] **Schemas** — per-feature Zod schemas in `features/<f>/model/*.schema.ts`
   (types inferred), shared `isoDate` / money quad, composed snapshot schema
   in `app/client/snapshot.schema.ts` (SQL `NULL` → `undefined`).
   `domain/types.ts` becomes a temporary re-export barrel.
2. [ ] **Write API** — one endpoint per business action, one transaction each,
   Zod-validated, tested against `:memory:` SQLite. New ids: `shared/db/new-id.ts`.
3. [ ] **Client** — `useDb()` (snapshot query + Zod), `useUiPrefs` (display
   currency, current member), per-feature mutation hooks → invalidate snapshot.
   Remove `src/mock/store.ts`. Verify every screen in the browser.
4. [ ] **Slices** — dissolve `domain/`, `mock/`, `i18n/`, `components/fos/`;
   split every file over 250 lines; `npm run check:size` exits 0.
5. [ ] **Constraints** — won lead ⇒ client + engagement (conversion flow);
   subscription grace rule.

## Endpoints (step 2)

| Feature | Method + path | Action |
|---|---|---|
| rates | `PUT /api/rates/today` | save daily rate (upsert by `effective_on`) |
| invoices | `POST /api/invoices` | issue invoice (numbering server-side) |
| invoices | `POST /api/invoices/:id/payments` | record payment (+ proof metadata) |
| engagements | `POST /api/deliverables/:id/rounds` | add feedback round |
| engagements | `POST /api/deliverables/:id/approval` | approve deliverable |
| engagements | `POST /api/deliverables/:id/bill-overage` | bill out-of-scope rounds |
| engagements | `POST /api/engagements/:id/bill-overage` | bill retainer hours |
| engagements | `POST /api/engagements/:id/scope` | change scope (+ invoice) |
| engagements | `POST /api/engagements/:id/renew` · `/grace` · `/stop` | subscription decisions |
| engagements | `POST /api/stages/:id/toggle` | toggle stage |
| time | `POST /api/time` | log time |
| leads | `POST /api/leads/:id/stage` | move lead |
| today | `POST /api/tasks` · `/tasks/:id/toggle` · `/tasks/carry-over` | tasks |
| today | `PUT /api/reflections/today` | save reflection |
| clients | `POST /api/vault/:id/reveal` | locked until phase 3 (423) |
