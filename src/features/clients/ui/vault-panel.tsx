import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useRevealSecret } from '../api/use-reveal-secret'

/** A revealed secret hides itself again after this long. */
const REVEAL_MS = 10_000

/** Saved logins for one client; secrets are fetched only on reveal. */
export function VaultPanel({ clientId }: { clientId: string }) {
  const { t } = useTranslation()
  const vault = useDb().vault
  const reveal = useRevealSecret()
  const [revealed, setRevealed] = useState<{ id: string; secret: string }>()
  const entries = vault.filter((v) => v.clientId === clientId)

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
    >
      <p className='mb-3 text-xs text-muted-foreground'>
        {t('clients.vaultHint')}
      </p>
      {entries.length === 0 ? (
        <EmptyState>{t('clients.noVault')}</EmptyState>
      ) : (
        <ul className='grid gap-2'>
          {entries.map((entry) => {
            const isShown = revealed?.id === entry.id
            return (
              <li
                key={entry.id}
                className='grid gap-1 rounded-lg border p-3 text-sm'
              >
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>{entry.label}</span>
                  <Button
                    size='sm'
                    variant='ghost'
                    disabled={reveal.isPending}
                    onClick={() =>
                      isShown
                        ? setRevealed(undefined)
                        : reveal.mutate(entry.id, {
                            onSuccess: ({ secret }) =>
                              setRevealed({ id: entry.id, secret }),
                          })
                    }
                  >
                    {isShown ? <EyeOff /> : <Eye />}
                    {isShown ? t('common.hide') : t('common.show')}
                  </Button>
                </div>
                <div className='num text-xs text-muted-foreground'>
                  {entry.username}
                </div>
                <div className='num text-sm'>
                  {isShown ? revealed.secret : '••••••••••'}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
