import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

/** Route error screen: says loading failed and offers a retry. */
export function LoadError() {
  const { t } = useTranslation()
  const router = useRouter()
  const { reset } = useQueryErrorResetBoundary()
  const retry = () => {
    reset()
    void router.invalidate()
  }
  return (
    <div
      role='alert'
      className='flex min-h-[60svh] flex-col items-center justify-center gap-3 p-6 text-center'
    >
      <AlertTriangle className='size-10 text-destructive' aria-hidden />
      <h1 className='text-lg font-semibold'>{t('common.loadFailed')}</h1>
      <p className='text-sm text-muted-foreground'>
        {t('common.loadFailedHint')}
      </p>
      <Button onClick={retry} className='mt-2'>
        <RotateCw /> {t('common.retry')}
      </Button>
    </div>
  )
}
