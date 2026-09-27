import { useTranslation } from 'react-i18next'
import { Skeleton } from '@/components/ui/skeleton'

/** Placeholder shown while a route loads its data. */
export function PageSkeleton() {
  const { t } = useTranslation()
  return (
    <div
      role='status'
      aria-label={t('common.loading')}
      className='mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6'
    >
      <Skeleton className='h-8 w-48' />
      <div className='grid gap-4 sm:grid-cols-3'>
        <Skeleton className='h-24' />
        <Skeleton className='h-24' />
        <Skeleton className='h-24' />
      </div>
      <Skeleton className='h-64' />
    </div>
  )
}
