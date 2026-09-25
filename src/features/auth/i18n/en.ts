import type { Widen } from '@/shared/i18n/widen'
import type { authAr } from './ar'

export const authEn: Widen<typeof authAr> = {
  auth: {
    title: 'Sign in',
    subtitle: 'Sign in to reach your work',
    login: 'Login name or email',
    password: 'Password',
    submit: 'Sign in',
    signingIn: 'Signing in…',
    signOut: 'Sign out',
    signOutTitle: 'Sign out on this device?',
    signOutHint: 'You will need your password to sign in again.',
    sessionEnded: 'Your session ended — please sign in again',
    account: {
      title: 'My account',
      name: 'Name',
      login: 'Login name (any name or email)',
      newPassword: 'New password',
      repeatPassword: 'Repeat it',
      currentPassword: 'Current password (to confirm)',
      passwordHint:
        'Leave the new password empty to keep the current one. Changing it signs out your other devices.',
      tooShort_one: 'At least 1 character',
      tooShort: 'At least {{count}} characters',
      mismatch: 'The two passwords differ',
      saved: 'Account saved',
    },
  },
}
