import { createFileRoute } from '@tanstack/react-router'
import { Clients } from '@/features/clients'

export const Route = createFileRoute('/_authenticated/clients/')({
  component: Clients,
})
