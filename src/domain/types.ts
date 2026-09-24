/**
 * Temporary barrel (phase 2): row types now come from each feature's Zod
 * schema (`features/<f>/model/*.schema.ts`). Import from there in new code;
 * this file disappears when `domain/` is dissolved.
 *
 * Rules still in force:
 *  - Money is INTEGER minor units (halala / cent / fils). Format with /100.
 *  - Every money record stores amount + currency + rateToBase + baseAmount.
 *  - Derived values (paid, balance, status, usage, approved, health) are
 *    never stored — see ./selectors.ts.
 */
import type { Currency } from '@/shared/money/currency'

export type { Currency }
export type { MoneyFields } from '@/shared/money/money.schema'
export type { PaymentMethodKind } from '@/features/settings/model/enums'
export type {
  BillingIdentity,
  PaymentMethod,
  Settings,
  TeamMember,
} from '@/features/settings/model/settings.schema'
export type { Client, VaultEntry } from '@/features/clients/model/clients.schema'
export type { LeadStage } from '@/features/leads/model/enums'
export type { Lead } from '@/features/leads/model/lead.schema'
export type {
  AllowanceUnit,
  CycleDecision,
  EngagementStatus,
  EngagementType,
  RoundSource,
} from '@/features/engagements/model/enums'
export type {
  Engagement,
  EngagementCycle,
} from '@/features/engagements/model/engagement.schema'
export type {
  Approval,
  Deliverable,
  ReviewRound,
  Stage,
} from '@/features/engagements/model/work.schema'
export type { AttachmentKind } from '@/features/files/model/enums'
export type { Attachment } from '@/features/files/model/attachment.schema'
export type {
  InvoiceItemSource,
  InvoiceKind,
  InvoiceState,
} from '@/features/invoices/model/enums'
export type {
  Invoice,
  InvoiceItem,
  Payment,
} from '@/features/invoices/model/invoice.schema'
export type { ExpenseCategory } from '@/features/finance/model/enums'
export type {
  Expense,
  OwnSubscription,
} from '@/features/finance/model/finance.schema'
export type { TimeEntry } from '@/features/time/model/time.schema'
export type { ImportantDate } from '@/features/calendar/model/calendar.schema'
export type { DailyReflection, Task } from '@/features/today/model/today.schema'

/** ISO calendar date / instant strings (kept for existing signatures). */
export type ISODate = string
export type ISODateTime = string

/** Derived — never stored. */
export type InvoiceStatus =
  'draft' | 'void' | 'unpaid' | 'partial' | 'paid' | 'overdue'

/** Last rate the owner typed per currency — used to prefill, never applied silently. */
export type LastRates = Record<Currency, number>
