import { AxiosError } from 'axios'
import { toast } from 'sonner'
import i18n from 'i18next'
import { ApiError } from '@/shared/http/api-client'

/** Translated message for an API error code, else the generic one. */
function apiErrorMessage(error: ApiError) {
  const key = `apiErrors.${error.code}`
  return i18n.exists(key) ? i18n.t(key) : i18n.t('apiErrors.generic')
}

export function handleServerError(error: unknown) {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log(error)
  }

  let errMsg = 'Something went wrong!'

  if (error instanceof ApiError) {
    toast.error(apiErrorMessage(error))
    return
  }

  if (
    error &&
    typeof error === 'object' &&
    'status' in error &&
    Number(error.status) === 204
  ) {
    errMsg = 'No content.'
  }

  if (error instanceof AxiosError) {
    const title = error.response?.data?.title
    if (typeof title === 'string' && title.length > 0) {
      errMsg = title
    }
  }

  toast.error(errMsg)
}
