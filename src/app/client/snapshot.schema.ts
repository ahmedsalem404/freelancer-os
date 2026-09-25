import { z } from 'zod'
import { stripNulls } from '@/shared/model/schema'
import { importantDateSchema } from '@/features/calendar/model/calendar.schema'
import {
  clientSchema,
  vaultEntrySchema,
} from '@/features/clients/model/clients.schema'
import {
  cycleSchema,
  engagementSchema,
} from '@/features/engagements/model/engagement.schema'
import {
  approvalSchema,
  deliverableSchema,
  reviewRoundSchema,
  stageSchema,
} from '@/features/engagements/model/work.schema'
import { attachmentSchema } from '@/features/files/model/attachment.schema'
import {
  expenseSchema,
  ownSubscriptionSchema,
} from '@/features/finance/model/finance.schema'
import {
  invoiceItemSchema,
  invoiceSchema,
  paymentSchema,
} from '@/features/invoices/model/invoice.schema'
import { leadSchema } from '@/features/leads/model/lead.schema'
import { portalLinkSchema } from '@/features/portal/model/portal.schema'
import { dailyRateSchema } from '@/features/rates/model/rates.schema'
import {
  billingIdentitySchema,
  paymentMethodSchema,
  settingsSchema,
  teamMemberSchema,
} from '@/features/settings/model/settings.schema'
import { timeEntrySchema } from '@/features/time/model/time.schema'
import {
  reflectionSchema,
  taskSchema,
} from '@/features/today/model/today.schema'

/**
 * Everything `GET /api/snapshot` returns, composed from each feature's
 * schemas (ARCHITECTURE.md §4). Shared by the client (response validation)
 * and the server (services run the same pure selectors on it).
 */
export const snapshotSchema = z.object({
  settings: settingsSchema,
  identities: z.array(billingIdentitySchema),
  paymentMethods: z.array(paymentMethodSchema),
  team: z.array(teamMemberSchema),
  dailyRates: z.array(dailyRateSchema),
  clients: z.array(clientSchema),
  vault: z.array(vaultEntrySchema),
  leads: z.array(leadSchema),
  engagements: z.array(engagementSchema),
  cycles: z.array(cycleSchema),
  stages: z.array(stageSchema),
  deliverables: z.array(deliverableSchema),
  rounds: z.array(reviewRoundSchema),
  approvals: z.array(approvalSchema),
  invoices: z.array(invoiceSchema),
  invoiceItems: z.array(invoiceItemSchema),
  payments: z.array(paymentSchema),
  expenses: z.array(expenseSchema),
  ownSubscriptions: z.array(ownSubscriptionSchema),
  timeEntries: z.array(timeEntrySchema),
  tasks: z.array(taskSchema),
  reflections: z.array(reflectionSchema),
  importantDates: z.array(importantDateSchema),
  attachments: z.array(attachmentSchema),
  portalLinks: z.array(portalLinkSchema),
})

export type Snapshot = z.infer<typeof snapshotSchema>

/** Raw JSON (SQL `NULL`s included) → validated snapshot. Throws on drift. */
export const parseSnapshot = (json: unknown): Snapshot =>
  snapshotSchema.parse(stripNulls(json))
