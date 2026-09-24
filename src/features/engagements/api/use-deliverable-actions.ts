import { useAction } from '@/app/client/use-action'
import { issuedInvoiceSchema } from '@/features/invoices/model/invoice.input'
import { callApi, seg } from '@/shared/http/api-client'
import { z } from 'zod'
import type { addFeedbackInput, approveInput } from '../model/engagement.input'

type FeedbackVars = z.input<typeof addFeedbackInput> & { deliverableId: string }
type ApproveVars = z.input<typeof approveInput> & { deliverableId: string }

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
