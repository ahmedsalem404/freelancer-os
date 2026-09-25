import {
  type EngagementTermsInput,
  engagementTermsInput,
} from '@/features/engagements/model/terms.input'

/**
 * Body of `POST /api/leads/:id/convert`: the engagement the won lead opens.
 * Money is in minor units, in the lead's currency.
 */
export const convertLeadInput = engagementTermsInput

export type ConvertLeadInput = EngagementTermsInput
