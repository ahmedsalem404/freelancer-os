import { ExternalLink, Link2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function ClientLinkPanel({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const url = `${window.location.origin}/p/${engagementId}`
  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm'>
      <div className='grid gap-0.5'>
        <span className='flex items-center gap-2 font-medium'>
          <Link2 className='size-4' /> {t('engagements.clientLink')}
        </span>
        <span className='text-xs text-muted-foreground'>
          {t('engagements.clientLinkHint')}
        </span>
      </div>
      <div className='flex gap-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() => {
            void navigator.clipboard?.writeText(url)
            toast.success(t('common.copied'))
          }}
        >
          {t('common.copy')}
        </Button>
        <Button asChild size='sm' variant='ghost'>
          <a
            href={`/p/${engagementId}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            <ExternalLink /> {t('common.open')}
          </a>
        </Button>
      </div>
    </div>
  )
}
