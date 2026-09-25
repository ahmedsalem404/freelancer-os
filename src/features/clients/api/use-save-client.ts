import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { ClientInput } from '../model/client.input'

const saved = z.object({ id: z.string() })

/** Creates a client, or replaces its fields when `clientId` is given. */
export const useSaveClient = () =>
  useAction(({ clientId, ...body }: ClientInput & { clientId?: string }) =>
    clientId
      ? callApi('PUT', `/clients/${seg(clientId)}`, saved, body)
      : callApi('POST', '/clients', saved, body)
  )
