import { createFileRoute } from '@tanstack/react-router'
import { Finance } from '@/features/finance'

export const Route = createFileRoute('/_authenticated/finance')({
  component: Finance,
})
