import { createFileRoute } from '@tanstack/react-router'
import { Portal, PortalUnavailable, portalQuery } from '@/features/portal'

export const Route = createFileRoute('/p/$token')({
  // The public page reads only its own token-scoped view — never the snapshot.
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(portalQuery(params.token)),
  errorComponent: PortalUnavailable,
  component: function RouteComponent() {
    const { token } = Route.useParams()
    return <Portal key={token} token={token} />
  },
})
