import { createFileRoute } from '@tanstack/react-router'
import { EngagementDetail } from '@/features/engagements/ui/engagement-detail'

export const Route = createFileRoute('/_authenticated/engagements/$id')({
  component: function EngagementRoute() {
    const { id } = Route.useParams()
    return <EngagementDetail key={id} id={id} />
  },
})
