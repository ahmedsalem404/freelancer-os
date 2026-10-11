import { Header } from '@/app/client/layout/header'
import { Search } from '@/app/client/layout/search'
import { useUiPrefs } from '@/app/client/ui-prefs'
import { useLocale } from '@/shared/context/direction-provider'
import { useTheme } from '@/shared/context/theme-provider'
import { cn } from '@/shared/lib/utils'
import { CURRENCIES } from '@/shared/money/currency'
import { Languages, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DailyRateButton } from '@/features/rates/ui/daily-rate-button'

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
