import { toast } from 'sonner'
import i18n from 'i18next'
import { ApiError } from '@/shared/http/api-client'

/** Translated message for an API error code, else the generic one. */
function apiErrorMessage(error: ApiError) {
  const key = `apiErrors.${error.code}`
  return i18n.exists(key) ? i18n.t(key) : i18n.t('apiErrors.generic')
}

/** The toast for a failed write (main.tsx wires it to every mutation). */
export function handleServerError(error: unknown) {
  toast.error(
    error instanceof ApiError
      ? apiErrorMessage(error)
      : i18n.t('apiErrors.generic')
  )
}
