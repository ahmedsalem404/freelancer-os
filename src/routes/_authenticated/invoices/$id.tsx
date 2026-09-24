import { createFileRoute } from '@tanstack/react-router'
import { InvoiceDetail } from '@/features/invoices/detail'

export const Route = createFileRoute('/_authenticated/invoices/$id')({
  component: function RouteComponent() {
    const { id } = Route.useParams()
    return <InvoiceDetail key={id} id={id} />
  },
})
