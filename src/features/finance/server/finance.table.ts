import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  unique,
} from 'drizzle-orm/sqlite-core'
import { id, inList, moneyQuad, timestamps } from '../../../shared/db/columns'
import { engagements } from '../../engagements/server/engagements.table'
import { EXPENSE_CATEGORIES, SUBSCRIPTION_PERIODS } from '../model/enums'

/** The owner's own tools (Figma, hosting…) — not client subscriptions. */
export const ownSubscriptions = sqliteTable(
  'own_subscriptions',
  {
    id: id(),
    name: text().notNull(),
    vendor: text(),
    category: text(),
    ...moneyQuad(),
    period: text({ enum: SUBSCRIPTION_PERIODS }).notNull(),
    startedOn: text().notNull(),
    nextRenewalOn: text().notNull(),
    cancelledOn: text(),
    remindDaysBefore: integer().notNull().default(3),
    ...timestamps(),
  },
  (t) => [
    check(
      'own_sub_period',
      sql`${t.period} IN ${inList(SUBSCRIPTION_PERIODS)}`
    ),
  ]
)

/** Owner spending; renewal charges of own subscriptions land here too. */
export const expenses = sqliteTable(
  'expenses',
  {
    id: id(),
    title: text().notNull(),
    category: text({ enum: EXPENSE_CATEGORIES }).notNull(),
    ...moneyQuad(),
    spentOn: text().notNull(),
    vendor: text(),
    ownSubscriptionId: text().references(() => ownSubscriptions.id),
    engagementId: text().references(() => engagements.id),
    note: text(),
    ...timestamps(),
  },
  (t) => [
    check(
      'expense_category',
      sql`${t.category} IN ${inList(EXPENSE_CATEGORIES)}`
    ),
    unique('expense_sub_charge').on(t.ownSubscriptionId, t.spentOn),
    index('expenses_spent').on(t.spentOn),
  ]
)
