import { createFileRoute } from '@tanstack/react-router'
import { Today } from '@/features/today'

export const Route = createFileRoute('/_authenticated/')({
  component: Today,
})
