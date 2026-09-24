import { callApi, seg } from '@/shared/http/api-client'
import { useMutation } from '@tanstack/react-query'
import { z } from 'zod'

/** Reveals one vault secret; the API keeps it locked until phase 3. */
export const useRevealSecret = () =>
  useMutation({
    mutationFn: (vaultEntryId: string) =>
      callApi(
        'POST',
        `/vault/${seg(vaultEntryId)}/reveal`,
        z.object({ secret: z.string() })
      ),
  })
