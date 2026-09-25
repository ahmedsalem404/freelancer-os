import { useLocale } from '@/shared/context/direction-provider'
import { cn } from '@/shared/lib/utils'
import { Languages, Link2Off } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { usePortalView } from '../api/portal-query'
import { PortalDeliverable } from './portal-deliverable'

function LanguageToggle() {
  const { lang, toggleLang } = useLocale()
  return (
    <Button variant='ghost' size='sm' onClick={toggleLang}>
      <Languages /> {lang === 'ar' ? 'EN' : 'ع'}
    </Button>
  )
}

/** Public status + approval page behind a client link. */
export function Portal({ token }: { token: string }) {
  const { t } = useTranslation()
  const view = usePortalView(token)
  const doneStages = view.stages.filter((s) => s.isDone).length

  return (
    <div className='min-h-svh bg-background'>
      <div className='h-1.5' style={{ backgroundColor: view.identity.color }} />
      <main className='mx-auto grid max-w-3xl gap-8 px-4 py-10'>
        <header className='flex items-start justify-between gap-4'>
          <div className='flex items-center gap-3'>
            <span
              className='grid size-11 shrink-0 place-items-center rounded-lg font-bold text-white'
              style={{ backgroundColor: view.identity.color }}
            >
              {view.identity.initials}
            </span>
            <div className='grid'>
              <span className='text-xs text-muted-foreground'>
                {t('portal.preparedBy', { name: view.identity.name })}
              </span>
              <h1 className='font-display text-2xl font-semibold'>
                {view.engagement.title}
              </h1>
            </div>
          </div>
          <LanguageToggle />
        </header>

        {view.stages.length > 0 && (
          <section className='grid gap-3'>
            <h2 className='text-sm font-semibold'>{t('portal.progress')}</h2>
            <ol className='flex gap-1'>
              {view.stages.map((stage, index) => (
                <li key={stage.id} className='grid flex-1 gap-1.5'>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      'h-2 origin-right rounded-full ltr:origin-left',
                      index < doneStages
                        ? 'bg-primary'
                        : index === doneStages
                          ? 'bg-primary/40'
                          : 'bg-muted'
                    )}
                  />
                  <span
                    className={cn(
                      'text-xs',
                      index <= doneStages
                        ? 'font-medium'
                        : 'text-muted-foreground'
                    )}
                  >
                    {stage.title}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section className='grid gap-3'>
          <h2 className='text-sm font-semibold'>{t('portal.deliverables')}</h2>
          {view.deliverables.map((d) => (
            <PortalDeliverable key={d.id} token={token} deliverable={d} />
          ))}
        </section>
      </main>
    </div>
  )
}

/** A link that is unknown, revoked or expired — all look the same. */
export function PortalUnavailable() {
  const { t } = useTranslation()
  return (
    <div className='grid min-h-svh place-items-center bg-background px-4'>
      <div className='grid max-w-sm justify-items-center gap-3 text-center'>
        <Link2Off className='size-10 text-muted-foreground' />
        <h1 className='text-lg font-semibold'>{t('portal.unavailable')}</h1>
        <p className='text-sm text-muted-foreground'>
          {t('portal.unavailableHint')}
        </p>
        <LanguageToggle />
      </div>
    </div>
  )
}
