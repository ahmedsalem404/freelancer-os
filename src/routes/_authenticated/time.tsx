import { createFileRoute } from '@tanstack/react-router'
import { TimePage } from '@/features/time'

export const Route = createFileRoute('/_authenticated/time')({
  component: TimePage,
})
