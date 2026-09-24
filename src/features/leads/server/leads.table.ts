import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList, moneyQuad, timestamps } from '../../../shared/db/columns'
import { clients } from '../../clients/server/clients.table'
import { engagements } from '../../engagements/server/engagements.table'
import { LEAD_STAGES } from '../model/enums'

/** Pipeline: lead → proposal → negotiation → won / lost (database.md §3.4). */
export const leads = sqliteTable(
  'leads',
  {
    id: id(),
    name: text().notNull(),
    company: text(),
    whatsapp: text(),
    service: text().notNull(),
    stage: text({ enum: LEAD_STAGES }).notNull().default('lead'),
    ...moneyQuad(),
    source: text(),
    proposalSentOn: text(),
    lastContactOn: text(),
    nextFollowUpOn: text(),
    lostReason: text(),
    closedAt: text(),
    clientId: text().references(() => clients.id),
    engagementId: text().references(() => engagements.id),
    position: integer().notNull().default(0),
    notes: text(),
    ...timestamps(),
  },
  (t) => [
    check('lead_stage', sql`${t.stage} IN ${inList(LEAD_STAGES)}`),
    check(
      'lead_closed_dated',
      sql`${t.stage} NOT IN ('won','lost') OR ${t.closedAt} IS NOT NULL`
    ),
    // "won ⇒ client + engagement linked" lands with the conversion flow (phase 2).
    index('leads_stage').on(t.stage, t.position),
    index('leads_follow_up').on(t.nextFollowUpOn),
  ]
)
