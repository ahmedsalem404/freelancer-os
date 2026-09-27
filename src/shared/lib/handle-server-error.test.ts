import '@/app/client/i18n'
import { ApiError } from '@/shared/http/api-client'
import i18n from 'i18next'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { handleServerError } from './handle-server-error'

const toastError = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({ toast: { error: toastError } }))

beforeAll(() => i18n.changeLanguage('en'))
beforeEach(() => toastError.mockClear())

describe('handleServerError', () => {
  it('shows the translated message for a known API error code', () => {
    handleServerError(new ApiError('overpayment', 'too much', 422))
    expect(toastError).toHaveBeenCalledWith(i18n.t('apiErrors.overpayment'))
  })

  it('falls back to the generic message for an unknown code', () => {
    handleServerError(new ApiError('no_such_code', 'x', 422))
    expect(toastError).toHaveBeenCalledWith(i18n.t('apiErrors.generic'))
  })

  it('shows the generic message for anything that is not an API error', () => {
    handleServerError(new Error('boom'))
    expect(toastError).toHaveBeenCalledWith(i18n.t('apiErrors.generic'))
  })
})
