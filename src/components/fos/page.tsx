import { useUiPrefs } from '@/app/client/ui-prefs'
import type { ReactNode } from 'react'
import { CURRENCIES } from '@/domain/money'
import { Languages, Moon, Sun } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useLocale } from '@/context/direction-provider'
import { useTheme } from '@/context/theme-provider'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { DailyRateButton } from './daily-rate'

function CurrencyToggle() {
  const { t } = useTranslation()
  const display = useUiPrefs((s) => s.displayCurrency)
  const setDisplay = useUiPrefs((s) => s.setDisplayCurrency)
  return (
    <div
      role='radiogroup'
      aria-label={t('common.reportCurrency')}
      className='flex h-8 items-center rounded-md border bg-card p-0.5 text-xs'
    >
      {CURRENCIES.map((c) => (
        <button
          key={c}
          role='radio'
          aria-checked={display === c}
          onClick={() => setDisplay(c)}
          className={cn(
            'num h-full rounded-[5px] px-2 transition-colors',
            display === c
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {c}
        </button>
      ))}
    </div>
  )
}

function LangToggle() {
  const { lang, toggleLang } = useLocale()
  const { t } = useTranslation()
  return (
    <Button
      variant='ghost'
      size='sm'
      onClick={toggleLang}
      aria-label={t('common.language')}
      className='h-8 gap-1.5 px-2'
    >
      <Languages className='size-4' />
      <span className='text-xs font-semibold'>
        {lang === 'ar' ? 'EN' : 'ع'}
      </span>
    </Button>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = resolvedTheme === 'dark'
  return (
    <Button
      variant='ghost'
      size='icon'
      className='size-8'
      aria-label={t('common.theme')}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? <Sun className='size-4' /> : <Moon className='size-4' />}
    </Button>
  )
}

export function AppHeader() {
  const { t } = useTranslation()
  return (
    <Header fixed>
      <Search
        placeholder={t('common.search')}
        className='min-w-9 overflow-hidden'
      />
      <div className='ms-auto flex items-center gap-1.5'>
        <DailyRateButton />
        <CurrencyToggle />
        <LangToggle />
        <ThemeToggle />
      </div>
    </Header>
  )
}

type PageShellProps = {
  title: ReactNode
  subtitle?: ReactNode
  eyebrow?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function PageShell({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  className,
}: PageShellProps) {
  const reduce = useReducedMotion()
  return (
    <>
      <AppHeader />
      <Main className={cn('pb-16', className)}>
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className='grid gap-6'
        >
          <header className='flex flex-wrap items-end justify-between gap-4'>
            <div className='grid gap-1'>
              {eyebrow && (
                <div className='text-xs font-medium text-muted-foreground'>
                  {eyebrow}
                </div>
              )}
              <h1 className='font-display text-2xl font-semibold sm:text-[28px]'>
                {title}
              </h1>
              {subtitle && (
                <p className='max-w-prose text-sm text-muted-foreground'>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div className='flex flex-wrap items-center gap-2'>{actions}</div>
            )}
          </header>
          {children}
        </motion.div>
      </Main>
    </>
  )
}

type PanelProps = {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: PanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-[0_1px_0_rgba(13,31,36,0.04)]',
        className
      )}
    >
      {(title || action) && (
        <div className='flex items-center justify-between gap-3 border-b px-4 py-3'>
          <h2 className='text-sm font-semibold'>{title}</h2>
          {action}
        </div>
      )}
      <div className={cn('p-4', bodyClassName)}>{children}</div>
    </section>
  )
}

type StatTileProps = {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  tone?: 'default' | 'billable' | 'overdue'
}

const TONE: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: '',
  billable: 'border-billable/50 bg-billable-soft/60',
  overdue: 'border-overdue/40 bg-overdue-soft/50',
}

export function StatTile({
  label,
  value,
  hint,
  tone = 'default',
}: StatTileProps) {
  return (
    <div className={cn('grid gap-1 rounded-xl border bg-card p-4', TONE[tone])}>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='text-2xl leading-tight font-semibold'>{value}</div>
      {hint && <div className='text-xs text-muted-foreground'>{hint}</div>}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className='rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground'>
      {children}
    </div>
  )
}
