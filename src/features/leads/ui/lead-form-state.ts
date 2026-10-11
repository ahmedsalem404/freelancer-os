import { type Currency } from '@/shared/money/currency'
import { toMajor } from '@/shared/money/money'
import type { Lead } from '@/features/leads/model/lead.schema'

/** The dialog's text-field state: amounts stay strings until validated. */
export type LeadFormValues = {
  name: string
  company: string
  whatsapp: string
  service: string
  amount: string
  currency: Currency
  source: string
  nextFollowUpOn: string
  notes: string
}

export type SetLeadField = <K extends keyof LeadFormValues>(
  key: K
) => (value: LeadFormValues[K]) => void

export function initialLeadForm(lead?: Lead): LeadFormValues {
  return {
    name: lead?.name ?? '',
    company: lead?.company ?? '',
    whatsapp: lead?.whatsapp ?? '',
    service: lead?.service ?? '',
    amount: lead ? String(toMajor(lead.amount)) : '',
    currency: lead?.currency ?? 'SAR',
    source: lead?.source ?? '',
    nextFollowUpOn: lead?.nextFollowUpOn ?? '',
    notes: lead?.notes ?? '',
  }
}
