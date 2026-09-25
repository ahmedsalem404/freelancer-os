import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { ExpenseInput } from '../model/expense.input'

const saved = z.object({ id: z.string() })

/** Records an expense, or replaces it when `id` is given. */
export const useSaveExpense = () =>
  useAction(({ id, ...body }: ExpenseInput & { id?: string }) =>
    id
      ? callApi('PUT', `/expenses/${seg(id)}`, saved, body)
      : callApi('POST', '/expenses', saved, body)
  )

export const useDeleteExpense = () =>
  useAction((id: string) => callApi('DELETE', `/expenses/${seg(id)}`, saved))
