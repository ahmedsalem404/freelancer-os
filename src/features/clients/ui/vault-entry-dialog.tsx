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
import { useSaveVaultEntry } from '../api/use-vault'
import type { VaultEntry } from '../model/clients.schema'

type Props = {
  clientId: string
  /** The entry to edit; omitted to add a new one. */
  entry?: VaultEntry
  onClose: () => void
}

/** Add or edit a saved login. On edit, a blank secret keeps the saved one. */
export function VaultEntryDialog({ clientId, entry, onClose }: Props) {
  const { t } = useTranslation()
  const save = useSaveVaultEntry()
  const [label, setLabel] = useState(entry?.label ?? '')
  const [url, setUrl] = useState(entry?.url ?? '')
  const [username, setUsername] = useState(entry?.username ?? '')
  const [secret, setSecret] = useState('')
  const [notes, setNotes] = useState('')
  const isValid = label.trim() !== '' && (entry !== undefined || secret !== '')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || save.isPending) return
    save.mutate(
      { clientId, entryId: entry?.id, label, url, username, secret, notes },
      {
        onSuccess: () => {
          toast.success(t('clients.vaultSaved'))
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {t(entry ? 'clients.vaultEdit' : 'clients.vaultAdd')}
            </DialogTitle>
            <DialogDescription>{t('clients.vaultHint')}</DialogDescription>
          </DialogHeader>
          <TextField
            id='vault-label'
            label={t('clients.vaultLabel')}
            placeholder='cPanel, Instagram…'
            value={label}
            onChange={setLabel}
          />
          <TextField
            id='vault-url'
            label={t('clients.vaultUrl')}
            dir='ltr'
            value={url}
            onChange={setUrl}
          />
          <TextField
            id='vault-username'
            label={t('clients.vaultUsername')}
            dir='ltr'
            autoComplete='off'
            value={username}
            onChange={setUsername}
          />
          <div className='grid gap-2'>
            <Label htmlFor='vault-secret'>{t('clients.vaultSecret')}</Label>
            <PasswordInput
              id='vault-secret'
              dir='ltr'
              autoComplete='new-password'
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
            {entry && (
              <p className='text-xs text-muted-foreground'>
                {t('clients.vaultKeepSecret')}
              </p>
            )}
          </div>
          <TextField
            id='vault-notes'
            label={t('clients.vaultNotes')}
            hint={entry ? t('clients.vaultNotesHint') : undefined}
            isMultiline
            value={notes}
            onChange={setNotes}
          />
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <PendingButton
              type='submit'
              disabled={!isValid}
              isPending={save.isPending}
            >
              {t('common.save')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
