import { useSuspenseQuery } from '@tanstack/react-query'
import { useLocale } from '@/shared/context/direction-provider'
import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AccountPanel, SignOutButton, sessionQuery } from '@/features/auth'
import { useWorkspace } from '../api/workspace-query'
import { MyCloseDay } from './my-close-day'
import { MyTasks } from './my-tasks'
import { MyTime } from './my-time'

/**
 * The assistant's whole app: their tasks, their time and their end-of-day
 * note. It reads `/api/workspace` only — never the owner's snapshot.
 */
export function MyDayPage() {
  const { t } = useTranslation()
  const { lang, setLang } = useLocale()
  const { data: member } = useSuspenseQuery(sessionQuery)
  const workspace = useWorkspace()

  return (
    <div className='min-h-svh bg-muted/30'>
      <header className='sticky top-0 z-10 border-b bg-background/90 backdrop-blur'>
        <div className='mx-auto flex max-w-3xl items-center gap-3 px-4 py-3'>
          <span className='relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-primary text-primary-foreground'>
            <span className='num text-[11px] font-semibold'>OS</span>
            <span className='absolute inset-x-0 bottom-0 h-1.5 hatch-billable opacity-90' />
          </span>
          <span className='min-w-0 flex-1 truncate font-display font-semibold'>
            {t('myDay.hello', { name: member?.name ?? '' })}
          </span>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          >
            <Languages /> {lang === 'ar' ? 'English' : 'العربية'}
          </Button>
          <SignOutButton />
        </div>
      </header>
      <main className='mx-auto grid max-w-3xl gap-4 px-4 py-6'>
        <MyTasks workspace={workspace} />
        <MyTime workspace={workspace} />
        <MyCloseDay workspace={workspace} />
        <AccountPanel />
      </main>
    </div>
  )
}
