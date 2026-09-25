import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import { createdPortalLinkSchema } from '../model/portal.schema'

/** Opens (or replaces) the engagement's client link; the token comes once. */
export const useCreatePortalLink = () =>
  useAction((engagementId: string) =>
    callApi(
      'POST',
      `/engagements/${seg(engagementId)}/portal-link`,
      createdPortalLinkSchema
    )
  )

export const useRevokePortalLink = () =>
  useAction((engagementId: string) =>
    callApi(
      'DELETE',
      `/engagements/${seg(engagementId)}/portal-link`,
      z.object({ engagementId: z.string() })
    )
  )
