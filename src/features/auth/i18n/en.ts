import type { Widen } from '@/shared/i18n/widen'
import type { authAr } from './ar'

export const authEn: Widen<typeof authAr> = {
  auth: {
    title: 'Sign in',
    subtitle: 'Sign in to reach your work',
    email: 'Email',
    password: 'Password',
    submit: 'Sign in',
    signingIn: 'Signing in…',
    signOut: 'Sign out',
    signOutTitle: 'Sign out on this device?',
    signOutHint: 'You will need your password to sign in again.',
    sessionEnded: 'Your session ended — please sign in again',
  },
}
