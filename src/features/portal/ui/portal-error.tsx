import type { ErrorComponentProps } from '@tanstack/react-router'
import { LoadError } from '@/shared/components/load-error'
import { ApiError } from '@/shared/http/api-client'
import { PortalUnavailable } from './portal-page'

/** A dead link says so; a network or server hiccup offers a retry. */
export function PortalError({ error }: ErrorComponentProps) {
  const isDeadLink =
    error instanceof ApiError && (error.status === 404 || error.status === 410)
  return isDeadLink ? <PortalUnavailable /> : <LoadError />
}
