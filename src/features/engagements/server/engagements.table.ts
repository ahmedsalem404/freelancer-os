import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList, moneyQuad, timestamps } from '../../../shared/db/columns'
import { clients } from '../../clients/server/clients.table'
import { billingIdentities } from '../../settings/server/identities.table'
import {
  ALLOWANCE_UNITS,
  CYCLE_PERIODS,
  ENGAGEMENT_STATUSES,
  ENGAGEMENT_TYPES,
  PAYMENT_CHANNELS,
} from '../model/enums'

/**
 * The CHECK lists below still name the retired `retainer` type and its
 * units: SQLite can't alter a CHECK without rebuilding the table (which would
 * cascade-delete its children), and rows of that type are deleted by
 * migration 0005 anyway. The app never writes them.
 */
const DB_TYPES = ['project', 'retainer', 'subscription'] as const
const DB_UNITS = ['revisions', 'hours', 'tickets', 'days'] as const

/**
 * One table for project / subscription (database.md §3.5).
 * `leadId` is a plain id (no FK) to keep the leads → engagements direction.
 */
export const engagements = sqliteTable(
  'engagements',
  {
    id: id(),
    clientId: text()
      .notNull()
      .references(() => clients.id),
    billingIdentityId: text().references(() => billingIdentities.id),
    leadId: text(),
    type: text({ enum: ENGAGEMENT_TYPES }).notNull(),
    status: text({ enum: ENGAGEMENT_STATUSES }).notNull().default('active'),
    title: text().notNull(),
    description: text(),
    ...moneyQuad(),
    /** Agreed way to pay; validated by the API (no CHECK: ADD COLUMN only). */
    paymentChannel: text({ enum: PAYMENT_CHANNELS }),
    startOn: text().notNull(),
    endOn: text(),
    allowanceUnit: text({ enum: ALLOWANCE_UNITS }).notNull(),
    /** Retainer: units per cycle. Project/subscription: 0 / cycle days. */
    allowanceIncluded: real().notNull().default(0),
    overageUnitPrice: integer().notNull().default(0),
    defaultRevisionLimit: integer(),
    scopeAgreedDeliverables: integer().notNull().default(0),
    cyclePeriod: text({ enum: CYCLE_PERIODS }),
    graceDays: integer(),
    nextAction: text().notNull().default(''),
    nextActionOn: text(),
    lessonsNote: text(),
    archivedAt: text(),
    ...timestamps(),
  },
  (t) => [
    check('engagement_type', sql`${t.type} IN ${inList(DB_TYPES)}`),
    check(
      'engagement_status',
      sql`${t.status} IN ${inList(ENGAGEMENT_STATUSES)}`
    ),
    check('engagement_unit', sql`${t.allowanceUnit} IN ${inList(DB_UNITS)}`),
    check(
      'engagement_type_shape',
      sql`(${t.type} = 'project' AND ${t.allowanceUnit} = 'revisions'
           AND ${t.cyclePeriod} IS NULL AND ${t.allowanceIncluded} = 0)
       OR (${t.type} = 'retainer' AND ${t.allowanceUnit} IN ('hours','tickets')
           AND ${t.cyclePeriod} IS NOT NULL AND ${t.allowanceIncluded} > 0)
       OR (${t.type} = 'subscription' AND ${t.allowanceUnit} = 'days'
           AND ${t.cyclePeriod} IS NOT NULL
           AND ${t.graceDays} IS NOT NULL AND ${t.graceDays} >= 0)`
    ),
    check(
      'engagement_dates',
      sql`${t.endOn} IS NULL OR ${t.endOn} >= ${t.startOn}`
    ),
    check('engagement_amount', sql`${t.amount} >= 0`),
    index('engagements_client').on(t.clientId),
    index('engagements_type_status').on(t.type, t.status),
    index('engagements_next_action').on(t.nextActionOn),
  ]
)
