import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/app/client/layout/authenticated-layout'
import { snapshotQuery } from '@/app/client/snapshot-query'
import { sessionQuery } from '@/features/auth'

export const Route = createFileRoute('/_authenticated')({
  // The API enforces access; this only picks the screen.
  beforeLoad: async ({ context, location }) => {
    const member = await context.queryClient.ensureQueryData(sessionQuery)
    if (!member) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
    // Assistants get their own scoped screens later (ARCHITECTURE.md §6).
    if (member.role !== 'owner') throw redirect({ to: '/403' })
  },
  // Every screen reads the snapshot; load it once before rendering.
  loader: ({ context }) => context.queryClient.ensureQueryData(snapshotQuery),
  component: AuthenticatedLayout,
})
