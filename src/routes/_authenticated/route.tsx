import { createFileRoute } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/app/client/layout/authenticated-layout'
import { snapshotQuery } from '@/app/client/snapshot-query'

export const Route = createFileRoute('/_authenticated')({
  // Every screen reads the snapshot; load it once before rendering.
  loader: ({ context }) => context.queryClient.ensureQueryData(snapshotQuery),
  component: AuthenticatedLayout,
})
