import { ApiError } from '@/shared/http/api-client'

/**
 * Downloads `GET /api/backup` as a file. A fetch (not a plain link) so a
 * failure turns into a toast instead of a broken download.
 */
export async function downloadBackup(): Promise<void> {
  let response: Response
  try {
    response = await fetch('/api/backup')
  } catch {
    throw new ApiError('network', 'The server is not reachable', 0)
  }
  if (!response.ok) {
    const code = response.status === 401 ? 'unauthenticated' : 'generic'
    throw new ApiError(
      code,
      `Backup failed (${response.status})`,
      response.status
    )
  }
  const name =
    /filename="([^"]+)"/.exec(
      response.headers.get('content-disposition') ?? ''
    )?.[1] ?? 'freelancer-os-backup.zip'
  const url = URL.createObjectURL(await response.blob())
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}
