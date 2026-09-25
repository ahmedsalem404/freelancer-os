import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import { issuedInvoiceSchema } from '@/features/invoices/model/invoice.input'
import type {
  ownerApproveInput,
  teamFeedbackInput,
} from '../model/engagement.input'

type FeedbackVars = z.input<typeof teamFeedbackInput> & {
  deliverableId: string
}
type ApproveVars = z.input<typeof ownerApproveInput> & { deliverableId: string }

export const useAddFeedback = () =>
  useAction(({ deliverableId, ...body }: FeedbackVars) =>
    callApi(
      'POST',
      `/deliverables/${seg(deliverableId)}/rounds`,
      z.object({ roundNo: z.number().int() }),
      body
    )
  )

export const useApproveDeliverable = () =>
  useAction(({ deliverableId, ...body }: ApproveVars) =>
    callApi(
      'POST',
      `/deliverables/${seg(deliverableId)}/approval`,
      z.object({ id: z.string() }),
      body
    )
  )

export const useBillOverageRounds = () =>
  useAction((deliverableId: string) =>
    callApi(
      'POST',
      `/deliverables/${seg(deliverableId)}/bill-overage`,
      issuedInvoiceSchema
    )
  )
