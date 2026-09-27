import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/app/client/layout/authenticated-layout'
import { snapshotQuery } from '@/app/client/snapshot-query'
import { LoadError } from '@/shared/components/load-error'
import { PageSkeleton } from '@/shared/components/page-skeleton'
import { sessionQuery } from '@/features/auth'

export const Route = createFileRoute('/_authenticated')({
  // The API enforces access; this only picks the screen.
  beforeLoad: async ({ context, location }) => {
    const member = await context.queryClient.ensureQueryData(sessionQuery)
    if (!member) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
    // Assistants have their own screen, fed by /api/workspace only.
    if (member.role !== 'owner') throw redirect({ to: '/my-day' })
  },
  // Every screen reads the snapshot; load it once before rendering.
  loader: ({ context }) => context.queryClient.ensureQueryData(snapshotQuery),
  pendingComponent: PageSkeleton,
  errorComponent: LoadError,
  component: AuthenticatedLayout,
})
