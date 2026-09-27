import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoadError } from '@/shared/components/load-error'
import { PageSkeleton } from '@/shared/components/page-skeleton'
import { sessionQuery } from '@/features/auth'
import { MyDayPage, workspaceQuery } from '@/features/my-day'

export const Route = createFileRoute('/my-day')({
  // Assistants live here; the owner has the full app instead.
  beforeLoad: async ({ context, location }) => {
    const member = await context.queryClient.ensureQueryData(sessionQuery)
    if (!member) {
      throw redirect({ to: '/sign-in', search: { redirect: location.href } })
    }
    if (member.role === 'owner') throw redirect({ to: '/' })
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(workspaceQuery),
  pendingComponent: PageSkeleton,
  errorComponent: LoadError,
  component: MyDayPage,
})
