import { type MeterDb, engagementMeter } from '@/features/engagements/model/meter'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import {
  invoiceBalance,
  invoiceStatus,
  isOpenInvoice,
} from '@/features/invoices/model/invoice-status'
import type {
  Invoice,
  Payment,
} from '@/features/invoices/model/invoice.schema'

export type ClientHealth = 'good' | 'watch' | 'risk'

type MoneyDb = { invoices: Invoice[]; payments: Payment[] }

const RISK_OVERDUE = 2
const WATCH_OUT_OF_SCOPE = 3

export function clientHealth(
  db: MoneyDb & MeterDb & { engagements: Engagement[] },
  clientId: string,
  today: string
): ClientHealth {
  const overdue = db.invoices.filter(
    (i) =>
      i.clientId === clientId && invoiceStatus(db, i, today) === 'overdue'
  ).length
  const outOfScope = db.engagements
    .filter((e) => e.clientId === clientId)
    .reduce((s, e) => s + engagementMeter(db, e, today).overage, 0)
  if (overdue >= RISK_OVERDUE) return 'risk'
  if (overdue === 1 || outOfScope >= WATCH_OUT_OF_SCOPE) return 'watch'
  return 'good'
}

export function clientCollectedBase(db: MoneyDb, clientId: string) {
  const ids = new Set(
    db.invoices.filter((i) => i.clientId === clientId).map((i) => i.id)
  )
  return db.payments
    .filter((p) => ids.has(p.invoiceId) && p.status === 'confirmed')
    .reduce((s, p) => s + p.baseAmount, 0)
}

/** Outstanding in SAR minor units, using each invoice's own snapshot rate. */
export function clientOutstandingBase(
  db: MoneyDb,
  clientId: string,
  today: string
) {
  return db.invoices
    .filter((i) => i.clientId === clientId && isOpenInvoice(db, i, today))
    .reduce((s, i) => s + Math.round(invoiceBalance(db, i) * i.rateToBase), 0)
}
