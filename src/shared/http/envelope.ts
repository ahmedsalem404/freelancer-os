/** Every API response uses one envelope (rules/common/patterns.md). */
export type ApiSuccess<T> = { ok: true; data: T }
export type ApiFailure = { ok: false; error: { code: string; message: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export const success = <T>(data: T): ApiSuccess<T> => ({ ok: true, data })

export const failure = (code: string, message: string): ApiFailure => ({
  ok: false,
  error: { code, message },
})
