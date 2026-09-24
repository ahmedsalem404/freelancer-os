/**
 * Freelancer OS domain model — mirrors docs/database.md (one type per table).
 * Rules:
 *  - Money is INTEGER minor units (halala / cent / fils). Format with /100.
 *  - Every money record stores amount + currency + rateToBase + baseAmount.
 *  - Derived values (paid, balance, status, usage, approved, health) are
 *    never stored — see ./selectors.ts.
 */

export type Currency = 'SAR' | 'USD' | 'YER'

/** Calendar date 'YYYY-MM-DD' (`*_on` columns). */
export type ISODate = string
/** Instant ISO-8601 UTC (`*_at` columns). */
export type ISODateTime = string

export type MoneyFields = {
  amount: number
  currency: Currency
  /** SAR per 1 unit of `currency`, typed by the owner at write time. */
  rateToBase: number
  /** round(amount * rateToBase), in SAR minor units. */
  baseAmount: number
}

export type PaymentMethodKind = 'bank' | 'kuraimi' | 'usdt' | 'cash'

export type BillingIdentity = {
  id: string
  kind: 'personal' | 'business'
  name: string
  tagline: string
  initials: string
  color: string
  invoiceFooter?: string
}

export type PaymentMethod = {
  id: string
  billingIdentityId: string
  kind: PaymentMethodKind
  label: string
  details: string
}

export type Client = {
  id: string
  name: string
  company?: string
  kind: 'person' | 'company'
  whatsapp: string
  city: string
  timezone: string
  currency: Currency
  billingIdentityId: string
  color: string
  createdAt: ISODateTime
}

/** The UI never holds secrets — only labels. Secrets are revealed on demand. */
export type VaultEntry = {
  id: string
  clientId: string
  label: string
  username: string
  url?: string
}

export type Lead = MoneyFields & {
  id: string
  name: string
  company?: string
  whatsapp?: string
  service: string
  stage: LeadStage
  source: string
  lastContactOn: ISODate
  nextFollowUpOn?: ISODate
  clientId?: string
}

export type LeadStage = 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost'

export type EngagementType = 'project' | 'retainer' | 'subscription'
export type AllowanceUnit = 'revisions' | 'hours' | 'tickets' | 'days'
export type EngagementStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export type Engagement = MoneyFields & {
  id: string
  clientId: string
  title: string
  type: EngagementType
  status: EngagementStatus
  allowanceUnit: AllowanceUnit
  /** Units included per cycle (retainer) — projects use per-deliverable limits. */
  allowanceIncluded: number
  /** Minor units, in the engagement currency. */
  overageUnitPrice: number
  scopeAgreedDeliverables: number
  cyclePeriod?: 'monthly' | 'yearly'
  startOn: ISODate
  endOn?: ISODate
  nextAction: string
  nextActionOn?: ISODate
}

export type CycleDecision = 'pending' | 'renewed' | 'grace' | 'stopped'

export type EngagementCycle = {
  id: string
  engagementId: string
  seq: number
  startsOn: ISODate
  endsOn: ISODate
  includedUnits: number
  graceDays: number
  graceExtendedDays: number
  decision: CycleDecision
  renewalInvoiceId?: string
}

export type Stage = {
  id: string
  engagementId: string
  title: string
  position: number
  completedAt?: ISODateTime
}

export type Deliverable = {
  id: string
  engagementId: string
  title: string
  dueOn: ISODate
  revisionLimit: number
  origin: 'contract' | 'change_scope'
  /** The invoice line that billed a change-scope deliverable. */
  invoiceItemId?: string
  position: number
}

export type RoundSource = 'owner' | 'assistant' | 'client_link'

export type ReviewRound = {
  id: string
  deliverableId: string
  roundNo: number
  receivedOn: ISODate
  note: string
  source: RoundSource
  /** Set once this out-of-scope round has been billed. */
  invoiceItemId?: string
}

export type Approval = {
  id: string
  deliverableId: string
  source: 'client_link' | 'owner'
  decision: 'approved' | 'changes_requested'
  signerName?: string
  createdAt: ISODateTime
}

export type AttachmentKind =
  'contract' | 'agreement_chat' | 'payment_proof' | 'other'

export type Attachment = {
  id: string
  ownerType: 'engagement' | 'payment' | 'client'
  ownerId: string
  kind: AttachmentKind
  name: string
  uploadedOn: ISODate
}

export type InvoiceKind =
  'standard' | 'deposit' | 'overage' | 'renewal' | 'scope'
export type InvoiceState = 'draft' | 'issued' | 'void'

export type Invoice = MoneyFields & {
  id: string
  number: string
  state: InvoiceState
  kind: InvoiceKind
  clientId: string
  engagementId?: string
  billingIdentityId: string
  issueOn: ISODate
  dueOn: ISODate
  note?: string
}

export type InvoiceItemSource =
  | 'manual'
  | 'deposit'
  | 'revision_overage'
  | 'retainer_overage'
  | 'scope_change'
  | 'renewal'

export type InvoiceItem = {
  id: string
  invoiceId: string
  description: string
  quantity: number
  /** Minor units in the invoice currency. */
  unitPrice: number
  amount: number
  sourceKind: InvoiceItemSource
  deliverableId?: string
  cycleId?: string
}

/** Derived — never stored. */
export type InvoiceStatus =
  'draft' | 'void' | 'unpaid' | 'partial' | 'paid' | 'overdue'

export type Payment = MoneyFields & {
  id: string
  invoiceId: string
  /** Amount credited to the invoice, in the invoice currency (minor units). */
  appliedAmount: number
  receivedOn: ISODate
  method: PaymentMethodKind
  status: 'confirmed' | 'pending'
  reference?: string
}

export type ExpenseCategory =
  | 'software'
  | 'equipment'
  | 'contractors'
  | 'marketing'
  | 'subscription'
  | 'other'

export type Expense = MoneyFields & {
  id: string
  title: string
  category: ExpenseCategory
  spentOn: ISODate
  ownSubscriptionId?: string
}

export type OwnSubscription = MoneyFields & {
  id: string
  name: string
  period: 'monthly' | 'yearly'
  nextRenewalOn: ISODate
}

export type TimeEntry = {
  id: string
  memberId: string
  engagementId?: string
  clientId?: string
  description: string
  minutes: number
  workOn: ISODate
  billable: boolean
  countsToAllowance: boolean
}

export type ImportantDate = {
  id: string
  title: string
  kind: 'domain' | 'ssl' | 'hosting' | 'license' | 'other'
  dueOn: ISODate
  clientId?: string
}

export type Task = {
  id: string
  title: string
  engagementId?: string
  assigneeId: string
  dueOn: ISODate
  completedAt?: ISODateTime
}

export type TeamMember = {
  id: string
  name: string
  role: 'owner' | 'assistant'
  email: string
}

export type DailyReflection = {
  id: string
  memberId: string
  day: ISODate
  note: string
}

export type Settings = {
  invoicePrefix: string
  invoiceSeqYear: number
  invoiceSeqNext: number
  defaultDueDays: number
  reminderOffsets: number[]
  meterNearRatio: number
  dueSoonDays: number
}

/** Last rate the owner typed per currency — used to prefill, never applied silently. */
export type LastRates = Record<Currency, number>
