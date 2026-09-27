import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type { UploadFields } from '../model/upload.input'

const saved = z.object({ id: z.string() })

/** Where the browser opens a stored file (same-origin, cookie-authenticated). */
export const fileUrl = (id: string) => `/api/files/${seg(id)}`

/** Sends one file with its owner and kind as multipart form data. */
export function uploadFile(fields: UploadFields, file: File) {
  const form = new FormData()
  form.set('file', file)
  for (const [key, value] of Object.entries(fields)) {
    if (value) form.set(key, value)
  }
  return callApi('POST', '/files', saved, form)
}

export const useUploadFile = () =>
  useAction(({ fields, file }: { fields: UploadFields; file: File }) =>
    uploadFile(fields, file)
  )

export const useDeleteFile = () =>
  useAction((id: string) => callApi('DELETE', `/files/${seg(id)}`, saved))
