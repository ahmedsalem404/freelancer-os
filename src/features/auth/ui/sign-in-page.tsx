import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PasswordInput } from '@/shared/components/password-input'
import { TextField } from '@/shared/components/text-field'
import { Loader2, LogIn } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { safeRedirect } from '../api/session-query'
import { useSignIn } from '../api/use-auth-actions'
import { signInInput } from '../model/auth.schema'

type Props = { redirectTo?: string }

/** The only way in: email + password of a team member. */
export function SignInPage({ redirectTo }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signIn = useSignIn()
  const [form, setForm] = useState({ email: '', password: '' })
  const parsed = signInInput.safeParse(form)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!parsed.success || signIn.isPending) return
    signIn.mutate(parsed.data, {
      onSuccess: () =>
        navigate({ to: safeRedirect(redirectTo), replace: true }),
      onError: () => setForm((prev) => ({ ...prev, password: '' })),
    })
  }

  return (
    <main className='grid min-h-svh place-items-center bg-muted/40 px-4 py-10'>
      <div className='w-full max-w-sm'>
        <div className='mb-6 flex items-center justify-center gap-2.5'>
          <span className='relative grid size-9 place-items-center overflow-hidden rounded-md bg-primary text-primary-foreground'>
            <span className='num text-xs font-semibold'>OS</span>
            <span className='absolute inset-x-0 bottom-0 h-1.5 hatch-billable opacity-90' />
          </span>
          <span className='font-display text-lg font-semibold'>
            {t('app.name')}
          </span>
        </div>
        <form
          onSubmit={submit}
          className='grid gap-4 rounded-xl border bg-card p-6 shadow-sm'
        >
          <div className='grid gap-1'>
            <h1 className='text-lg font-semibold'>{t('auth.title')}</h1>
            <p className='text-sm text-muted-foreground'>
              {t('auth.subtitle')}
            </p>
          </div>
          <TextField
            id='sign-in-email'
            label={t('auth.email')}
            type='email'
            dir='ltr'
            autoComplete='username'
            autoFocus
            required
            value={form.email}
            onChange={(email) => setForm((prev) => ({ ...prev, email }))}
          />
          <div className='grid gap-2'>
            <Label htmlFor='sign-in-password'>{t('auth.password')}</Label>
            <PasswordInput
              id='sign-in-password'
              dir='ltr'
              autoComplete='current-password'
              required
              value={form.password}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, password: e.target.value }))
              }
            />
          </div>
          <Button
            type='submit'
            className='mt-1'
            disabled={!parsed.success || signIn.isPending}
          >
            {signIn.isPending ? (
              <Loader2 className='animate-spin' />
            ) : (
              <LogIn />
            )}
            {signIn.isPending ? t('auth.signingIn') : t('auth.submit')}
          </Button>
        </form>
      </div>
    </main>
  )
}
