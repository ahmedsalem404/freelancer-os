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
  team: {
    add: 'Add assistant',
    edit: 'Edit name and login',
    setPassword: 'Set a new password',
    stop: 'Stop account',
    restart: 'Restart account',
    addTitle: 'Add an assistant',
    addHint:
      'An assistant sees only their tasks and time — no money, no vault.',
    editTitle: 'Edit {{name}}',
    editHint: 'The login name is what the assistant signs in with.',
    passwordTitle: 'New password for {{name}}',
    passwordHint:
      'They are signed out everywhere and sign in with the new one.',
    stopTitle: 'Stop {{name}}’s account?',
    stopHint:
      'They can’t sign in and are signed out now. Their tasks and time stay; restart the account any time.',
    added: 'Assistant added',
    saved: 'Saved',
    passwordSet: 'Password set',
    stopped: 'Account stopped',
    restarted: 'Account restarted',
    status: {
      active: 'Assistant — active',
      noPassword: 'Assistant — no password',
      stopped: 'Stopped',
    },
  },
}
