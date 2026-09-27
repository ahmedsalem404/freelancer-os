import { useState } from 'react'
import { PasswordInput } from '@/shared/components/password-input'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import type { TeamMember } from '@/features/settings/model/settings.schema'
import {
  useAddAssistant,
  useResetPassword,
  useUpdateAssistant,
} from '../api/use-team'
import { PASSWORD_MIN } from '../model/auth.schema'

/** What the dialog does: add an assistant, edit one, or set a new password. */
export type MemberDialogMode =
  | { kind: 'add' }
  | { kind: 'edit'; member: TeamMember }
  | { kind: 'password'; member: TeamMember }

type Props = { mode: MemberDialogMode; onClose: () => void }

export function MemberDialog({ mode, onClose }: Props) {
  const { t } = useTranslation()
  const add = useAddAssistant()
  const update = useUpdateAssistant()
  const reset = useResetPassword()
  const member = mode.kind === 'add' ? undefined : mode.member
  const [name, setName] = useState(member?.name ?? '')
  const [login, setLogin] = useState(member?.email ?? '')
  const [password, setPassword] = useState('')
  const needsPassword = mode.kind !== 'edit'
  const needsProfile = mode.kind !== 'password'
  const isPending = add.isPending || update.isPending || reset.isPending
  const passwordError =
    password !== '' && password.length < PASSWORD_MIN
      ? t('auth.account.tooShort', { count: PASSWORD_MIN })
      : undefined
  const isValid =
    (!needsProfile || (name.trim() !== '' && login.trim() !== '')) &&
    (!needsPassword || password.length >= PASSWORD_MIN)

  const done = (message: string) => () => {
    toast.success(t(message))
    onClose()
  }
  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || isPending) return
    if (mode.kind === 'add') {
      add.mutate({ name, login, password }, { onSuccess: done('team.added') })
    } else if (mode.kind === 'edit') {
      update.mutate(
        { id: mode.member.id, name, login },
        { onSuccess: done('team.saved') }
      )
    } else {
      reset.mutate(
        { id: mode.member.id, password },
        { onSuccess: done('team.passwordSet') }
      )
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {t(`team.${mode.kind}Title`, { name: member?.name })}
            </DialogTitle>
            <DialogDescription>{t(`team.${mode.kind}Hint`)}</DialogDescription>
          </DialogHeader>
          {needsProfile && (
            <>
              <TextField
                id='member-name'
                label={t('auth.account.name')}
                value={name}
                onChange={setName}
              />
              <TextField
                id='member-login'
                label={t('auth.account.login')}
                dir='ltr'
                autoComplete='off'
                value={login}
                onChange={setLogin}
              />
            </>
          )}
          {needsPassword && (
            <div className='grid gap-2'>
              <Label htmlFor='member-password'>{t('auth.password')}</Label>
              <PasswordInput
                id='member-password'
                dir='ltr'
                autoComplete='new-password'
                aria-invalid={passwordError ? true : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && (
                <p className='text-xs text-destructive'>{passwordError}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <PendingButton
              type='submit'
              disabled={!isValid}
              isPending={isPending}
            >
              {t('common.save')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
