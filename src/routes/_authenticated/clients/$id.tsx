import { createFileRoute } from '@tanstack/react-router'
import { ClientDetail } from '@/features/clients/detail'

export const Route = createFileRoute('/_authenticated/clients/$id')({
  component: function RouteComponent() {
    const { id } = Route.useParams()
    return <ClientDetail key={id} id={id} />
  },
})
