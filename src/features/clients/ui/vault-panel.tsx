import { useEffect, useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { KeyRound, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { VaultEntry } from '../model/clients.schema'
import { VaultEntryDialog } from './vault-entry-dialog'
import { VaultEntryRow } from './vault-entry-row'

/** A revealed secret hides itself again after this long. */
const REVEAL_MS = 30_000

export type Revealed = { id: string; secret: string; notes?: string }

/** Saved logins for one client; secrets are fetched only on reveal. */
export function VaultPanel({ clientId }: { clientId: string }) {
  const { t } = useTranslation()
  const entries = useDb().vault.filter((v) => v.clientId === clientId)
  const [revealed, setRevealed] = useState<Revealed>()
  const [editing, setEditing] = useState<VaultEntry | 'new'>()

  useEffect(() => {
    if (!revealed) return
    const timer = setTimeout(() => setRevealed(undefined), REVEAL_MS)
    return () => clearTimeout(timer)
  }, [revealed])

  return (
    <Panel
      title={
        <span className='flex items-center gap-2'>
          <KeyRound className='size-4' /> {t('clients.vault')}
        </span>
      }
      action={
        <Button size='sm' variant='outline' onClick={() => setEditing('new')}>
          <Plus /> {t('clients.vaultAdd')}
        </Button>
      }
    >
      <p className='mb-3 text-xs text-muted-foreground'>
        {t('clients.vaultHint')}
      </p>
      {entries.length === 0 ? (
        <EmptyState>{t('clients.noVault')}</EmptyState>
      ) : (
        <ul className='grid gap-2'>
          {entries.map((entry) => (
            <VaultEntryRow
              key={entry.id}
              entry={entry}
              revealed={revealed?.id === entry.id ? revealed : undefined}
              onReveal={setRevealed}
              onHide={() => setRevealed(undefined)}
              onEdit={() => setEditing(entry)}
            />
          ))}
        </ul>
      )}
      {editing && (
        <VaultEntryDialog
          clientId={clientId}
          entry={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(undefined)}
        />
      )}
    </Panel>
  )
}
