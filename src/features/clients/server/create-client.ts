import { newId } from '@/shared/db/new-id'
import { DomainError } from '@/shared/http/errors'
import type { Currency } from '@/shared/money/currency'
import type { Ctx } from '@/shared/server/context'
import { asc, count } from 'drizzle-orm'
import { billingIdentities, settings } from '@/features/settings/server'
import type { ClientKind } from '../model/enums'
import { clients } from './clients.table'

/** Accent colours handed to new clients in turn. */
const CLIENT_COLORS = ['#0f766e', '#b4401f', '#3f6fb5', '#7c3aed', '#b7791f']

export type NewClient = {
  name: string
  company?: string
  whatsapp?: string
  currency: Currency
}

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
  return { id, timezone: setup?.timezone }
}

/** Creates a client (e.g. from a won lead) under the default identity. */
export function createClient(ctx: Ctx, input: NewClient) {
  const identity = defaultIdentityId(ctx)
  const existing = ctx.db.select({ n: count() }).from(clients).get()
  const kind: ClientKind = input.company ? 'company' : 'person'
  const id = newId('client')
  ctx.db
    .insert(clients)
    .values({
      id,
      kind,
      name: input.name,
      company: input.company,
      whatsapp: input.whatsapp,
      currency: input.currency,
      billingIdentityId: identity.id,
      timezone: identity.timezone,
      color: CLIENT_COLORS[(existing?.n ?? 0) % CLIENT_COLORS.length],
    })
    .run()
  return { id }
}
