import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Panel } from '@/shared/components/panel'
import { PasswordInput } from '@/shared/components/password-input'
import { TextField } from '@/shared/components/text-field'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { sessionQuery } from '../api/session-query'
import { useSaveAccount } from '../api/use-auth-actions'
import { PASSWORD_MIN, accountInput } from '../model/auth.schema'

type Form = {
  name: string
  login: string
  newPassword: string
  repeatPassword: string
  currentPassword: string
}

const EMPTY_PASSWORDS = {
  newPassword: '',
  repeatPassword: '',
  currentPassword: '',
}

/** The signed-in member edits their own name, login and password. */
export function AccountPanel({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { data: member } = useSuspenseQuery(sessionQuery)
  const save = useSaveAccount()
  const [form, setForm] = useState<Form>({
    name: member?.name ?? '',
    login: member?.email ?? '',
    ...EMPTY_PASSWORDS,
  })
  const set = (key: keyof Form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const parsed = accountInput.safeParse(form)
  const isMismatch = form.newPassword !== form.repeatPassword
  const isTooShort =
    form.newPassword !== '' && form.newPassword.length < PASSWORD_MIN

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!parsed.success || isMismatch || save.isPending) return
    save.mutate(parsed.data, {
      onSuccess: () => {
        toast.success(t('auth.account.saved'))
        setForm((prev) => ({ ...prev, ...EMPTY_PASSWORDS }))
      },
      onError: () => setForm((prev) => ({ ...prev, currentPassword: '' })),
    })
  }

  const passwordField = (key: keyof Form, id: string, hint?: string) => (
    <div className='grid gap-2'>
      <Label htmlFor={id}>{t(`auth.account.${key}`)}</Label>
      <PasswordInput
        id={id}
        dir='ltr'
        autoComplete={
          key === 'currentPassword' ? 'current-password' : 'new-password'
        }
        value={form[key]}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => set(key)(e.target.value)}
      />
      {hint && (
        <p id={`${id}-hint`} className='text-xs text-destructive'>
          {hint}
        </p>
      )}
    </div>
  )

  return (
    <Panel title={t('auth.account.title')} className={className}>
      <form onSubmit={submit} className='grid gap-4'>
        <div className='grid gap-4 sm:grid-cols-2'>
          <TextField
            id='account-name'
            label={t('auth.account.name')}
            value={form.name}
            onChange={set('name')}
            autoComplete='name'
          />
          <TextField
            id='account-login'
            label={t('auth.account.login')}
            dir='ltr'
            autoComplete='username'
            value={form.login}
            onChange={set('login')}
          />
          {passwordField(
            'newPassword',
            'account-new-password',
            isTooShort
              ? t('auth.account.tooShort', { count: PASSWORD_MIN })
              : undefined
          )}
          {passwordField(
            'repeatPassword',
            'account-repeat-password',
            isMismatch && form.repeatPassword !== ''
              ? t('auth.account.mismatch')
              : undefined
          )}
        </div>
        <p className='text-xs text-muted-foreground'>
          {t('auth.account.passwordHint')}
        </p>
        <div className='grid items-end gap-3 border-t pt-4 sm:grid-cols-[1fr_auto]'>
          {passwordField('currentPassword', 'account-current-password')}
          <Button
            type='submit'
            disabled={!parsed.success || isMismatch || save.isPending}
          >
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Panel>
  )
}
