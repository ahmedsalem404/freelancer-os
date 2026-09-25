import { useDb } from '@/app/client/snapshot-query'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { useDateFormat } from '@/shared/lib/dates'
import { useState } from 'react'
import { Copy, ExternalLink, Link2, RefreshCw, Unlink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useCreatePortalLink, useRevokePortalLink } from '../api/use-portal-link'

const portalUrl = (token: string) => `${window.location.origin}/p/${token}`

/**
 * The engagement's client link. Only a hash is stored, so the full URL is
 * shown (and copied) right after it is created — later, only its hint.
 */
export function ClientLinkPanel({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const link = useDb().portalLinks.find((l) => l.engagementId === engagementId)
  const create = useCreatePortalLink()
  const revoke = useRevokePortalLink()
  const [freshUrl, setFreshUrl] = useState<string>()
  const [isRevoking, setIsRevoking] = useState(false)

  const copy = (url: string) => {
    void navigator.clipboard?.writeText(url)
    toast.success(t('common.copied'))
  }

  const openNew = () =>
    create.mutate(engagementId, {
      onSuccess: ({ token }) => {
        const url = portalUrl(token)
        setFreshUrl(url)
        copy(url)
      },
    })

  return (
    <div className='grid gap-3 rounded-xl border border-dashed p-4 text-sm'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='grid gap-0.5'>
          <span className='flex items-center gap-2 font-medium'>
            <Link2 className='size-4' /> {t('engagements.clientLink')}
          </span>
          <span className='text-xs text-muted-foreground'>
            {link
              ? t('portal.link.active', {
                  hint: link.tokenHint,
                  count: link.viewCount,
                  date: fmt(link.createdAt.slice(0, 10)),
                })
              : t('engagements.clientLinkHint')}
          </span>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button size='sm' onClick={openNew} disabled={create.isPending}>
            {link ? <RefreshCw /> : <Link2 />}
            {link ? t('portal.link.regenerate') : t('portal.link.create')}
          </Button>
          {link && (
            <Button
              size='sm'
              variant='ghost'
              onClick={() => setIsRevoking(true)}
            >
              <Unlink /> {t('portal.link.revoke')}
            </Button>
          )}
        </div>
      </div>

      {freshUrl && link && (
        <div className='grid gap-2 rounded-lg bg-muted/50 p-3'>
          <span className='text-xs text-muted-foreground'>
            {t('portal.link.onceHint')}
          </span>
          <div className='flex items-center gap-2'>
            <code dir='ltr' className='min-w-0 flex-1 truncate text-xs'>
              {freshUrl}
            </code>
            <Button size='sm' variant='outline' onClick={() => copy(freshUrl)}>
              <Copy /> {t('common.copy')}
            </Button>
            <Button asChild size='sm' variant='ghost'>
              <a href={freshUrl} target='_blank' rel='noopener noreferrer'>
                <ExternalLink /> {t('common.open')}
              </a>
            </Button>
          </div>
        </div>
      )}

      {isRevoking && (
        <ConfirmDialog
          open
          onOpenChange={(isOpen) => !isOpen && setIsRevoking(false)}
          destructive
          title={t('portal.link.revokeTitle')}
          desc={t('portal.link.revokeHint')}
          confirmText={t('portal.link.revoke')}
          cancelBtnText={t('common.cancel')}
          isLoading={revoke.isPending}
          handleConfirm={() =>
            revoke.mutate(engagementId, {
              onSuccess: () => {
                setFreshUrl(undefined)
                setIsRevoking(false)
                toast.success(t('portal.link.revoked'))
              },
            })
          }
        />
      )}
    </div>
  )
}
