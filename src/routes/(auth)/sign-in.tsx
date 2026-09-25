import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignInPage, sessionQuery } from '@/features/auth'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  validateSearch: searchSchema,
  // Already signed in: nothing to do here.
  beforeLoad: async ({ context }) => {
    const member = await context.queryClient.ensureQueryData(sessionQuery)
    if (member) throw redirect({ to: '/' })
  },
  component: function SignInRoute() {
    const { redirect: redirectTo } = Route.useSearch()
    return <SignInPage redirectTo={redirectTo} />
  },
})
