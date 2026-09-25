import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useSignOut } from '../api/use-auth-actions'

/** Icon button that asks, then ends this device's session. */
export function SignOutButton() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const signOut = useSignOut()
  const [isOpen, setIsOpen] = useState(false)

  const confirm = () =>
    signOut.mutate(undefined, {
      onSettled: () => navigate({ to: '/sign-in', replace: true }),
    })

  return (
    <>
      <Button
        variant='ghost'
        size='icon'
        className='size-8 shrink-0 text-muted-foreground'
        aria-label={t('auth.signOut')}
        title={t('auth.signOut')}
        onClick={() => setIsOpen(true)}
      >
        <LogOut className='size-4 rtl:rotate-180' />
      </Button>
      <ConfirmDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        title={t('auth.signOutTitle')}
        desc={t('auth.signOutHint')}
        confirmText={t('auth.signOut')}
        cancelBtnText={t('common.cancel')}
        destructive
        isLoading={signOut.isPending}
        handleConfirm={confirm}
        className='sm:max-w-sm'
      />
    </>
  )
}
