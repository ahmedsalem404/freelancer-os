import { Link } from '@tanstack/react-router'
import { EmptyState } from '@/shared/components/empty-state'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { PageShell } from './page-shell'

type Props = {
  title: string
  /** The list this record lives in. */
  backTo: '/clients' | '/engagements' | '/finance'
}

/** A detail page whose record is gone (deleted, or a stale link). */
export function RecordNotFound({ title, backTo }: Props) {
  const { t } = useTranslation()
  return (
    <PageShell title={title}>
      <EmptyState>
        <p>{t('common.notFoundHint')}</p>
        <Button asChild variant='outline' size='sm' className='mt-3'>
          <Link to={backTo}>
            <ArrowLeft className='rtl:-scale-x-100' /> {t('common.backToList')}
          </Link>
        </Button>
      </EmptyState>
    </PageShell>
  )
}
