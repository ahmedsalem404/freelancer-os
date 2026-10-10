import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import { issuedInvoiceSchema } from '@/features/invoices/model/invoice.input'
import type { ChangeScopeInput } from '../model/engagement.input'

const path = (engagementId: string, action: string) =>
  `/engagements/${seg(engagementId)}/${action}`

export const useChangeScope = () =>
  useAction(
    ({ engagementId, ...body }: ChangeScopeInput & { engagementId: string }) =>
      callApi('POST', path(engagementId, 'scope'), issuedInvoiceSchema, body)
  )

export const useRenewCycle = () =>
  useAction((engagementId: string) =>
    callApi('POST', path(engagementId, 'renew'), issuedInvoiceSchema)
  )

export const useExtendGrace = () =>
  useAction(({ engagementId, days }: { engagementId: string; days: number }) =>
    callApi(
      'POST',
      path(engagementId, 'grace'),
      z.object({ graceExtendedDays: z.number().int() }),
      { days }
    )
  )

export const useStopCycle = () =>
  useAction((engagementId: string) =>
    callApi(
      'POST',
      path(engagementId, 'stop'),
      z.object({ status: z.string() })
    )
  )

export const useResumeCycle = () =>
  useAction((engagementId: string) =>
    callApi(
      'POST',
      path(engagementId, 'resume'),
      z.object({ status: z.string() })
    )
  )

export const useToggleStage = () =>
  useAction((stageId: string) =>
    callApi(
      'POST',
      `/stages/${seg(stageId)}/toggle`,
      z.object({ completedAt: z.string().nullable() })
    )
  )
