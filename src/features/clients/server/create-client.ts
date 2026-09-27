import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { asc, count, eq, sql } from 'drizzle-orm'
import { billingIdentities, settings } from '@/features/settings/server'
import type { ClientFields } from '../model/client.input'
import type { ClientKind } from '../model/enums'
import { clients } from './clients.table'

/** Accent colours handed to new clients in turn. */
const CLIENT_COLORS = ['#0f766e', '#b4401f', '#3f6fb5', '#7c3aed', '#b7791f']

export type NewClient = Pick<ClientFields, 'name' | 'currency'> &
  Partial<Omit<ClientFields, 'name' | 'currency'>>

function defaultIdentityId(ctx: Ctx) {
  const setup = ctx.db.select().from(settings).get()
  const first = ctx.db
    .select({ id: billingIdentities.id })
    .from(billingIdentities)
    .orderBy(asc(billingIdentities.createdAt))
    .get()
  const id = setup?.defaultBillingIdentityId ?? first?.id
  if (!id) {
    throw new DomainError('no_identity', 'Add a billing identity first', 409)
  }
  return id
}

/** The chosen identity (checked) or the default one. */
function identityFor(ctx: Ctx, id: string | undefined) {
  if (id === undefined) return defaultIdentityId(ctx)
  const row = ctx.db
    .select({ id: billingIdentities.id })
    .from(billingIdentities)
    .where(eq(billingIdentities.id, id))
    .get()
  if (!row) {
    throw new DomainError('unknown_identity', `Identity ${id} does not exist`)
  }
  return row.id
}

/** Stored columns for the editable fields; blanks clear the column. */
function columns(ctx: Ctx, input: NewClient) {
  const kind: ClientKind = input.company ? 'company' : 'person'
  return {
    kind,
    name: input.name,
    company: input.company ?? null,
    whatsapp: input.whatsapp ?? null,
    email: input.email ?? null,
    city: input.city ?? null,
    currency: input.currency,
    notes: input.notes ?? null,
    billingIdentityId: identityFor(ctx, input.billingIdentityId),
  }
}

/** Creates a client (from the form or a won lead). */
export function createClient(ctx: Ctx, input: NewClient) {
  const existing = ctx.db.select({ n: count() }).from(clients).get()
  const timezone = ctx.db.select().from(settings).get()?.timezone
  const id = newId('client')
  ctx.db
    .insert(clients)
    .values({
      id,
      ...columns(ctx, input),
      timezone,
      color: CLIENT_COLORS[(existing?.n ?? 0) % CLIENT_COLORS.length],
    })
    .run()
  return { id }
}

/**
 * Whether any invoice names this client. Read by table name: `invoices`
 * sits above `clients` in the dependency order (ARCHITECTURE.md §3).
 */
const hasInvoices = (ctx: Ctx, clientId: string) =>
  ctx.db.get<{ found: number } | undefined>(
    sql`SELECT 1 AS found FROM invoices WHERE client_id = ${clientId} LIMIT 1`
  ) !== undefined

/**
 * Replaces a client's editable fields. Past records keep their snapshots;
 * the currency is fixed once an invoice exists.
 */
export function updateClient(ctx: Ctx, id: string, input: NewClient) {
  const current = required(
    ctx.db
      .select({ id: clients.id, currency: clients.currency })
      .from(clients)
      .where(eq(clients.id, id))
      .get(),
    'client',
    id
  )
  if (input.currency !== current.currency && hasInvoices(ctx, id)) {
    throw new DomainError(
      'currency_locked',
      'The client has invoices; their currency is fixed',
      409
    )
  }
  ctx.db
    .update(clients)
    .set(columns(ctx, input))
    .where(eq(clients.id, id))
    .run()
  return { id }
}
