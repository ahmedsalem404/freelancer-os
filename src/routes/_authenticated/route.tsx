import { createFileRoute } from '@tanstack/react-router'
import { snapshotQuery } from '@/app/client/snapshot-query'
import { AuthenticatedLayout } from '@/app/client/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  // Every screen reads the snapshot; load it once before rendering.
  loader: ({ context }) => context.queryClient.ensureQueryData(snapshotQuery),
  component: AuthenticatedLayout,
})
