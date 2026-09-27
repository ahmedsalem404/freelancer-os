import { createFileRoute } from '@tanstack/react-router'
import { PageSkeleton } from '@/shared/components/page-skeleton'
import { Portal, PortalError, portalQuery } from '@/features/portal'

export const Route = createFileRoute('/p/$token')({
  // The public page reads only its own token-scoped view — never the snapshot.
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(portalQuery(params.token)),
  pendingComponent: PageSkeleton,
  errorComponent: PortalError,
  component: function RouteComponent() {
    const { token } = Route.useParams()
    return <Portal key={token} token={token} />
  },
})
