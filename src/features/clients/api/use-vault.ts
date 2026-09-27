import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import {
  revealedSecretSchema,
  type VaultEntryInput,
} from '../model/vault.input'

const saved = z.object({ id: z.string() })

type SaveVars = VaultEntryInput & { clientId: string; entryId?: string }

/** Adds a login to a client, or edits one when `entryId` is given. */
export const useSaveVaultEntry = () =>
  useAction(({ clientId, entryId, ...body }: SaveVars) =>
    entryId
      ? callApi('PUT', `/vault/${seg(entryId)}`, saved, body)
      : callApi('POST', `/clients/${seg(clientId)}/vault`, saved, body)
  )

export const useDeleteVaultEntry = () =>
  useAction((entryId: string) =>
    callApi('DELETE', `/vault/${seg(entryId)}`, saved)
  )

/** Decrypts one entry. Not cached: the secret never enters the snapshot. */
export const useRevealSecret = () =>
  useMutation({
    mutationFn: (entryId: string) =>
      callApi('POST', `/vault/${seg(entryId)}/reveal`, revealedSecretSchema),
  })
