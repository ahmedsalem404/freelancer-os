import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import { issuedInvoiceSchema } from '@/features/invoices/model/invoice.input'
import type { LogTimeInput } from '../model/time.schema'

export const useLogTime = () =>
  useAction((input: LogTimeInput) =>
    callApi('POST', '/time', z.object({ id: z.string() }), input)
  )

/** Bills retainer hours above the cycle allowance. */
export const useBillExtraHours = () =>
  useAction((engagementId: string) =>
    callApi(
      'POST',
      `/engagements/${seg(engagementId)}/bill-hours`,
      issuedInvoiceSchema
    )
  )
