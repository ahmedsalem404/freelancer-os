import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { useLocale } from '@/shared/context/direction-provider'
import { useTheme } from '@/shared/context/theme-provider'
import { cn } from '@/shared/lib/utils'
import { isArchived } from '@/shared/model/archive'
import { Languages, Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { AccountPanel, TeamPanel } from '@/features/auth'
import { DailyRateEditor } from '@/features/rates/ui/daily-rate-editor'
import { BackupPanel } from './ui/backup-panel'

export function SettingsPage() {
  const { t } = useTranslation()
  const db = useDb()
  const { lang, setLang } = useLocale()
  const { resolvedTheme, setTheme } = useTheme()
  const year = new Date().getFullYear()
  const nextNumber = `${db.settings.invoicePrefix}-${year}-${String(
    db.settings.invoiceSeqNext
  ).padStart(3, '0')}`

  return (
    <PageShell title={t('settings.title')}>
      <div className='grid gap-4 lg:grid-cols-2'>
        <AccountPanel className='lg:col-span-2' />

        <Panel title={t('settings.identities')} className='lg:col-span-2'>
          <p className='mb-3 text-xs text-muted-foreground'>
            {t('settings.identitiesHint')}
          </p>
          <div className='grid gap-3 md:grid-cols-2'>
            {db.identities.map((identity) => (
              <div
                key={identity.id}
                className='grid gap-3 rounded-xl border p-4'
              >
                <div className='flex items-center gap-3'>
                  <span
                    className='grid size-10 place-items-center rounded-lg font-bold text-white'
                    style={{ backgroundColor: identity.color }}
                  >
                    {identity.initials}
                  </span>
                  <div className='grid'>
                    <span className='font-medium'>{identity.name}</span>
                    <span className='text-xs text-muted-foreground'>
                      {identity.tagline}
                    </span>
                  </div>
                </div>
                <ul className='grid gap-1 text-sm'>
                  {db.paymentMethods
                    .filter((m) => m.billingIdentityId === identity.id)
                    .map((m) => (
                      <li key={m.id} className='flex justify-between gap-2'>
                        <span>{m.label}</span>
                        <span className='num text-xs text-muted-foreground'>
                          {m.details}
                        </span>
                      </li>
                    ))}
                </ul>
                <div className='text-xs text-muted-foreground'>
                  {db.clients
                    .filter(
                      (c) =>
                        c.billingIdentityId === identity.id && !isArchived(c)
                    )
                    .map((c) => c.company ?? c.name)
                    .join(' · ')}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title={t('settings.currencies')}>
          <DailyRateEditor />
        </Panel>

        <Panel
          title={t('settings.invoicing')}
          bodyClassName='grid gap-3 text-sm'
        >
          <Row label={t('settings.prefix')} value={db.settings.invoicePrefix} />
          <Row label={t('settings.nextNumber')} value={nextNumber} />
          <Row
            label={t('settings.dueDays')}
            value={String(db.settings.defaultDueDays)}
          />
          <Row
            label={t('invoice.reminders')}
            value={db.settings.reminderOffsets.map((o) => `+${o}`).join(' · ')}
          />
        </Panel>

        <TeamPanel />

        <BackupPanel />

        <Panel
          title={t('settings.appearance')}
          bodyClassName='grid gap-3'
          className='lg:col-span-2'
        >
          <div className='flex flex-wrap gap-2'>
            {(['ar', 'en'] as const).map((l) => (
              <Button
                key={l}
                variant='outline'
                onClick={() => setLang(l)}
                className={cn(
                  lang === l && 'border-primary ring-2 ring-primary/20'
                )}
              >
                <Languages /> {l === 'ar' ? 'العربية' : 'English'}
              </Button>
            ))}
            {(['light', 'dark'] as const).map((theme) => (
              <Button
                key={theme}
                variant='outline'
                onClick={() => setTheme(theme)}
                className={cn(
                  resolvedTheme === theme &&
                    'border-primary ring-2 ring-primary/20'
                )}
              >
                {theme === 'light' ? <Sun /> : <Moon />} {t(`common.${theme}`)}
              </Button>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='num font-medium'>{value}</span>
    </div>
  )
}
