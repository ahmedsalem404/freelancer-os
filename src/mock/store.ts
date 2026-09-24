/**
 * In-memory store for the UI phase. State = the Db tables from
 * docs/database.md. Actions are immutable and each one mirrors a future API
 * call, so the backend phase only swaps this module.
 */
import { addDays, addMonths, addYears, format, parseISO } from 'date-fns'
import { type DailyRate, money, ratesFromDaily, toMinor } from '@/domain/money'
import {
  type Db,
  currentCycle,
  deliverablesOf,
  engagementMeter,
  roundsOf,
} from '@/domain/selectors'
import type {
  Currency,
  Invoice,
  InvoiceItem,
  InvoiceKind,
  LastRates,
  LeadStage,
  PaymentMethodKind,
  RoundSource,
} from '@/domain/types'
import { create } from 'zustand'
import { dailyRates, lastRates, seedDb, today } from './seed'

const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 9)}`
const iso = (date: Date) => format(date, 'yyyy-MM-dd')
const now = () => new Date().toISOString()

/** Mock-only: secrets live outside UI state and are revealed one at a time. */
const VAULT_SECRETS: Record<string, string> = {
  v1: 'N@khla-2026',
  v2: 'h0st!ng-88',
  v3: 'aws-Mx91-zz',
  v4: 'cp-Rf44-q',
}

type DraftItem = Omit<InvoiceItem, 'id' | 'invoiceId' | 'amount'>

type DraftInvoice = {
  clientId: string
  engagementId?: string
  kind: InvoiceKind
  currency: Currency
  rateToBase: number
  items: DraftItem[]
  note?: string
}

type UiPrefs = {
  displayCurrency: Currency
  /** Rate history the owner typed, newest first; [0] is today's rate. */
  dailyRates: DailyRate[]
  /** Derived from dailyRates[0] — prefill for new records. */
  lastRates: LastRates
  currentMemberId: string
}

type Actions = {
  issueInvoice: (draft: DraftInvoice) => Invoice
  addFeedback: (
    deliverableId: string,
    note: string,
    source?: RoundSource
  ) => number
  approveDeliverable: (
    deliverableId: string,
    source: 'owner' | 'client_link'
  ) => void
  billOverageRounds: (deliverableId: string) => Invoice | undefined
  billRetainerOverage: (engagementId: string) => Invoice | undefined
  logTime: (input: {
    engagementId?: string
    minutes: number
    description: string
    billable: boolean
  }) => void
  changeScope: (
    engagementId: string,
    input: { title: string; feeMinor: number; dueOn: string }
  ) => Invoice
  renewSubscription: (engagementId: string) => Invoice | undefined
  extendGrace: (engagementId: string, days: number) => void
  stopSubscription: (engagementId: string) => void
  recordPayment: (
    invoiceId: string,
    input: {
      amountMinor: number
      rateToBase: number
      method: PaymentMethodKind
      proofName?: string
    }
  ) => void
  moveLead: (leadId: string, stage: LeadStage) => void
  toggleTask: (taskId: string) => void
  addTask: (title: string, engagementId?: string) => void
  carryOverTasks: () => void
  saveReflection: (note: string) => void
  toggleStage: (stageId: string) => void
  setDisplayCurrency: (currency: UiPrefs['displayCurrency']) => void
  /** Saves today's rate (both quotes in YER); replaces today's entry. */
  setDailyRate: (sarInYer: number, usdInYer: number) => void
  revealSecret: (vaultEntryId: string) => string
}

export type Store = Db & UiPrefs & Actions

export const useStore = create<Store>()((set, get) => {
  const nextInvoiceNumber = () => {
    const { settings } = get()
    const year = new Date().getFullYear()
    const seq = settings.invoiceSeqYear === year ? settings.invoiceSeqNext : 1
    set({
      settings: { ...settings, invoiceSeqYear: year, invoiceSeqNext: seq + 1 },
    })
    return `${settings.invoicePrefix}-${year}-${String(seq).padStart(3, '0')}`
  }

  const issueInvoice = (draft: DraftInvoice): Invoice => {
    const { clients, settings } = get()
    const client = clients.find((c) => c.id === draft.clientId)
    const invoiceId = uid('inv')
    const items: InvoiceItem[] = draft.items.map((item) => ({
      ...item,
      id: uid('it'),
      invoiceId,
      amount: Math.round(item.quantity * item.unitPrice),
    }))
    const total = items.reduce((s, i) => s + i.amount, 0)
    const issueOn = today()
    const invoice: Invoice = {
      id: invoiceId,
      number: nextInvoiceNumber(),
      state: 'issued',
      kind: draft.kind,
      clientId: draft.clientId,
      engagementId: draft.engagementId,
      billingIdentityId: client?.billingIdentityId ?? get().identities[0].id,
      issueOn,
      dueOn: iso(addDays(parseISO(issueOn), settings.defaultDueDays)),
      note: draft.note,
      ...money(total, draft.currency, draft.rateToBase),
    }
    set((s) => ({
      invoices: [invoice, ...s.invoices],
      invoiceItems: [...s.invoiceItems, ...items],
    }))
    return invoice
  }

  const engagementOf = (id: string) =>
    get().engagements.find((e) => e.id === id)!

  return {
    ...seedDb(),
    displayCurrency: 'SAR',
    dailyRates,
    lastRates,
    currentMemberId: 'm-owner',

    issueInvoice,

    addFeedback: (deliverableId, note, source = 'owner') => {
      const roundNo = roundsOf(get(), deliverableId).length + 1
      set((s) => ({
        rounds: [
          ...s.rounds,
          {
            id: uid('r'),
            deliverableId,
            roundNo,
            receivedOn: today(),
            note,
            source,
          },
        ],
      }))
      return roundNo
    },

    approveDeliverable: (deliverableId, source) =>
      set((s) => ({
        approvals: [
          ...s.approvals,
          {
            id: uid('ap'),
            deliverableId,
            source,
            decision: 'approved',
            createdAt: now(),
          },
        ],
      })),

    billOverageRounds: (deliverableId) => {
      const db = get()
      const deliverable = db.deliverables.find((d) => d.id === deliverableId)!
      const e = engagementOf(deliverable.engagementId)
      const unbilled = roundsOf(db, deliverableId).filter(
        (r) => r.roundNo > deliverable.revisionLimit && !r.invoiceItemId
      )
      if (unbilled.length === 0) return undefined
      const invoice = issueInvoice({
        clientId: e.clientId,
        engagementId: e.id,
        kind: 'overage',
        currency: e.currency,
        rateToBase: get().lastRates[e.currency],
        items: [
          {
            description: `مراجعة إضافية — ${deliverable.title}`,
            quantity: unbilled.length,
            unitPrice: e.overageUnitPrice,
            sourceKind: 'revision_overage',
            deliverableId,
          },
        ],
      })
      const itemId = get().invoiceItems.find(
        (i) => i.invoiceId === invoice.id
      )!.id
      const ids = new Set(unbilled.map((r) => r.id))
      set((s) => ({
        rounds: s.rounds.map((r) =>
          ids.has(r.id) ? { ...r, invoiceItemId: itemId } : r
        ),
      }))
      return invoice
    },

    billRetainerOverage: (engagementId) => {
      const db = get()
      const e = engagementOf(engagementId)
      const cycle = currentCycle(db, engagementId)
      const meter = engagementMeter(db, e, today())
      if (!cycle || meter.unbilled <= 0) return undefined
      return issueInvoice({
        clientId: e.clientId,
        engagementId,
        kind: 'overage',
        currency: e.currency,
        rateToBase: get().lastRates[e.currency],
        items: [
          {
            description: `ساعات إضافية خارج الباقة — ${e.title}`,
            quantity: meter.unbilled,
            unitPrice: e.overageUnitPrice,
            sourceKind: 'retainer_overage',
            cycleId: cycle.id,
          },
        ],
      })
    },

    logTime: ({ engagementId, minutes, description, billable }) => {
      const e = engagementId ? engagementOf(engagementId) : undefined
      set((s) => ({
        timeEntries: [
          {
            id: uid('t'),
            memberId: s.currentMemberId,
            engagementId,
            clientId: e?.clientId,
            description,
            minutes,
            workOn: today(),
            billable,
            countsToAllowance: e?.type === 'retainer',
          },
          ...s.timeEntries,
        ],
      }))
    },

    changeScope: (engagementId, { title, feeMinor, dueOn }) => {
      const e = engagementOf(engagementId)
      const deliverableId = uid('dl')
      const invoice = issueInvoice({
        clientId: e.clientId,
        engagementId,
        kind: 'scope',
        currency: e.currency,
        rateToBase: get().lastRates[e.currency],
        items: [
          {
            description: `توسعة نطاق — ${title}`,
            quantity: 1,
            unitPrice: feeMinor,
            sourceKind: 'scope_change',
            deliverableId,
          },
        ],
      })
      const itemId = get().invoiceItems.find(
        (i) => i.invoiceId === invoice.id
      )!.id
      set((s) => ({
        deliverables: [
          ...s.deliverables,
          {
            id: deliverableId,
            engagementId,
            title,
            dueOn,
            revisionLimit: 2,
            origin: 'change_scope',
            invoiceItemId: itemId,
            position: deliverablesOf(s, engagementId).length,
          },
        ],
      }))
      return invoice
    },

    renewSubscription: (engagementId) => {
      const e = engagementOf(engagementId)
      const cycle = currentCycle(get(), engagementId)
      if (!cycle) return undefined
      const invoice = issueInvoice({
        clientId: e.clientId,
        engagementId,
        kind: 'renewal',
        currency: e.currency,
        rateToBase: get().lastRates[e.currency],
        items: [
          {
            description: `تجديد — ${e.title}`,
            quantity: 1,
            unitPrice: e.amount,
            sourceKind: 'renewal',
            cycleId: cycle.id,
          },
        ],
      })
      const start = parseISO(cycle.endsOn)
      const end =
        e.cyclePeriod === 'yearly' ? addYears(start, 1) : addMonths(start, 1)
      set((s) => ({
        engagements: s.engagements.map((x) =>
          x.id === engagementId ? { ...x, status: 'active' } : x
        ),
        cycles: [
          ...s.cycles.map((c) =>
            c.id === cycle.id
              ? {
                  ...c,
                  decision: 'renewed' as const,
                  renewalInvoiceId: invoice.id,
                }
              : c
          ),
          {
            ...cycle,
            id: uid('cy'),
            seq: cycle.seq + 1,
            startsOn: cycle.endsOn,
            endsOn: iso(end),
            graceExtendedDays: 0,
            decision: 'pending',
            renewalInvoiceId: undefined,
          },
        ],
      }))
      return invoice
    },

    extendGrace: (engagementId, days) => {
      const cycle = currentCycle(get(), engagementId)
      if (!cycle) return
      set((s) => ({
        cycles: s.cycles.map((c) =>
          c.id === cycle.id
            ? {
                ...c,
                decision: 'grace',
                graceExtendedDays: c.graceExtendedDays + days,
              }
            : c
        ),
      }))
    },

    stopSubscription: (engagementId) => {
      const cycle = currentCycle(get(), engagementId)
      set((s) => ({
        engagements: s.engagements.map((e) =>
          e.id === engagementId ? { ...e, status: 'paused' } : e
        ),
        cycles: s.cycles.map((c) =>
          c.id === cycle?.id ? { ...c, decision: 'stopped' } : c
        ),
      }))
    },

    recordPayment: (
      invoiceId,
      { amountMinor, rateToBase, method, proofName }
    ) => {
      const invoice = get().invoices.find((i) => i.id === invoiceId)!
      const paymentId = uid('p')
      set((s) => ({
        payments: [
          {
            id: paymentId,
            invoiceId,
            ...money(amountMinor, invoice.currency, rateToBase),
            appliedAmount: amountMinor,
            receivedOn: today(),
            method,
            status: 'confirmed',
          },
          ...s.payments,
        ],
        attachments: proofName
          ? [
              ...s.attachments,
              {
                id: uid('at'),
                ownerType: 'payment',
                ownerId: paymentId,
                kind: 'payment_proof',
                name: proofName,
                uploadedOn: today(),
              },
            ]
          : s.attachments,
      }))
    },

    moveLead: (leadId, stage) =>
      set((s) => ({
        leads: s.leads.map((l) =>
          l.id === leadId ? { ...l, stage, lastContactOn: today() } : l
        ),
      })),

    toggleTask: (taskId) =>
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, completedAt: t.completedAt ? undefined : now() }
            : t
        ),
      })),

    addTask: (title, engagementId) =>
      set((s) => ({
        tasks: [
          ...s.tasks,
          {
            id: uid('tk'),
            title,
            engagementId,
            assigneeId: s.currentMemberId,
            dueOn: today(),
          },
        ],
      })),

    carryOverTasks: () => {
      const tomorrow = iso(addDays(new Date(), 1))
      set((s) => ({
        tasks: s.tasks.map((t) =>
          !t.completedAt && t.dueOn <= today() ? { ...t, dueOn: tomorrow } : t
        ),
      }))
    },

    saveReflection: (note) =>
      set((s) => ({
        reflections: [
          ...s.reflections.filter(
            (r) => !(r.day === today() && r.memberId === s.currentMemberId)
          ),
          { id: uid('rf'), memberId: s.currentMemberId, day: today(), note },
        ],
      })),

    toggleStage: (stageId) =>
      set((s) => ({
        stages: s.stages.map((st) =>
          st.id === stageId
            ? { ...st, completedAt: st.completedAt ? undefined : now() }
            : st
        ),
      })),

    setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),

    setDailyRate: (sarInYer, usdInYer) =>
      set((s) => {
        const entry: DailyRate = { day: today(), sarInYer, usdInYer }
        return {
          dailyRates: [
            entry,
            ...s.dailyRates.filter((r) => r.day !== entry.day),
          ],
          lastRates: ratesFromDaily(entry),
        }
      }),

    revealSecret: (vaultEntryId) => VAULT_SECRETS[vaultEntryId] ?? '',
  }
})

export { today, dayOffset } from './seed'
export { toMinor }
