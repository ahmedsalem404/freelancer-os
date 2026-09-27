import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi } from '@/shared/http/api-client'
import type { TemplateKey, TemplateLocale } from '../model/templates'

const done = z.object({ key: z.string(), locale: z.string() })

type Target = { key: TemplateKey; locale: TemplateLocale }

export const useSaveTemplate = () =>
  useAction(({ key, locale, body }: Target & { body: string }) =>
    callApi('PUT', `/templates/${key}`, done, { locale, body })
  )

/** Back to the built-in text. */
export const useResetTemplate = () =>
  useAction(({ key, locale }: Target) =>
    callApi('DELETE', `/templates/${key}/${locale}`, done)
  )
