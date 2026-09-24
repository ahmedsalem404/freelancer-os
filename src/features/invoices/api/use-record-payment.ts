import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { RecordPaymentInput } from '../model/invoice.input'

const recorded = z.object({ id: z.string() })

export const useRecordPayment = () =>
  useAction(
    ({ invoiceId, ...input }: RecordPaymentInput & { invoiceId: string }) =>
      callApi('POST', `/invoices/${seg(invoiceId)}/payments`, recorded, input)
  )
