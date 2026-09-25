import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import {
  type CreateInvoiceInput,
  issuedInvoiceSchema,
  type VoidInvoiceInput,
} from '../model/invoice.input'

/** Issues a manual invoice. */
export const useCreateInvoice = () =>
  useAction((body: CreateInvoiceInput) =>
    callApi('POST', '/invoices', issuedInvoiceSchema, body)
  )

/** Voids an issued, unpaid invoice with a reason. */
export const useVoidInvoice = () =>
  useAction(({ id, ...body }: VoidInvoiceInput & { id: string }) =>
    callApi(
      'POST',
      `/invoices/${seg(id)}/void`,
      z.object({ id: z.string() }),
      body
    )
  )
