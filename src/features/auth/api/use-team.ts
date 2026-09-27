import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { AssistantInput, NewAssistantInput } from '../model/team.input'

const saved = z.object({ id: z.string() })

export const useAddAssistant = () =>
  useAction((input: NewAssistantInput) =>
    callApi('POST', '/team', saved, input)
  )

export const useUpdateAssistant = () =>
  useAction(({ id, ...input }: AssistantInput & { id: string }) =>
    callApi('PUT', `/team/${seg(id)}`, saved, input)
  )

export const useResetPassword = () =>
  useAction(({ id, password }: { id: string; password: string }) =>
    callApi('PUT', `/team/${seg(id)}/password`, saved, { password })
  )

export const useSetActive = () =>
  useAction(({ id, isActive }: { id: string; isActive: boolean }) =>
    callApi(
      'POST',
      `/team/${seg(id)}/${isActive ? 'activate' : 'deactivate'}`,
      saved
    )
  )
