import { createFileRoute } from '@tanstack/react-router'
import { Portal } from '@/features/portal'

export const Route = createFileRoute('/p/$token')({
  component: function RouteComponent() {
    const { token } = Route.useParams()
    return <Portal key={token} token={token} />
  },
})
