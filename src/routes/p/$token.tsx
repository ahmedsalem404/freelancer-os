import { createFileRoute } from '@tanstack/react-router'
import { snapshotQuery } from '@/app/client/snapshot-query'
import { Portal } from '@/features/portal'

export const Route = createFileRoute('/p/$token')({
  // Phase 3 replaces this with a token-scoped public endpoint.
  loader: ({ context }) => context.queryClient.ensureQueryData(snapshotQuery),
  component: function RouteComponent() {
    const { token } = Route.useParams()
    return <Portal key={token} token={token} />
  },
})
