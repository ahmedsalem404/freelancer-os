import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { StatTile } from '@/shared/components/stat-tile'
import { daysFrom, useDateFormat } from '@/shared/lib/dates'
import { todayIso } from '@/shared/model/dates'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'

const WINDOW_DAYS = 7
const hours = (minutes: number) => Math.round((minutes / 60) * 10) / 10

export function TimePage() {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const db = useDb()
  const now = todayIso()

  const recent = db.timeEntries.filter(
    (e) => -daysFrom(now, e.workOn) < WINDOW_DAYS
  )
  const total = recent.reduce((s, e) => s + e.minutes, 0)
  const billable = recent
    .filter((e) => e.billable)
    .reduce((s, e) => s + e.minutes, 0)
  const share = total > 0 ? Math.round((billable / total) * 100) : 0

  const byEngagement = Object.entries(
    db.timeEntries.reduce<Record<string, number>>((acc, e) => {
      const key = e.engagementId ?? 'general'
      return { ...acc, [key]: (acc[key] ?? 0) + e.minutes }
    }, {})
  ).sort((a, b) => b[1] - a[1])
  const max = byEngagement[0]?.[1] ?? 1
  const titleOf = (id: string) =>
    id === 'general'
      ? t('time.general')
      : db.engagements.find((e) => e.id === id)?.title

  return (
    <PageShell title={t('time.title')} subtitle={t('time.subtitle')}>
      <div className='grid gap-3 sm:grid-cols-2'>
        <StatTile
          label={t('time.week')}
          value={
            <span className='num'>
              {t('time.hoursShort', { h: hours(total) })}
            </span>
          }
        />
        <StatTile
          label={t('time.billableShare')}
          value={<span className='num'>{share}%</span>}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-2'>
        <Panel title={t('time.byEngagement')} bodyClassName='grid gap-3'>
          {byEngagement.map(([id, minutes], index) => (
            <div key={id} className='grid gap-1 text-sm'>
              <div className='flex justify-between gap-2'>
                <span className='truncate'>{titleOf(id)}</span>
                <span className='num text-muted-foreground'>
                  {t('time.hoursShort', { h: hours(minutes) })}
                </span>
              </div>
              <div className='h-2 overflow-hidden rounded-full bg-muted'>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: minutes / max }}
                  transition={{
                    delay: index * 0.05,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className='h-full origin-right rounded-full bg-primary ltr:origin-left'
                />
              </div>
            </div>
          ))}
        </Panel>

        <Panel title={t('time.entries')} bodyClassName='p-0'>
          <ul className='divide-y'>
            {db.timeEntries.map((entry) => (
              <li
                key={entry.id}
                className='flex items-center justify-between gap-3 px-4 py-3 text-sm'
              >
                <div className='grid gap-0.5'>
                  <span>{entry.description}</span>
                  <span className='text-xs text-muted-foreground'>
                    {fmt(entry.workOn)} ·{' '}
                    {titleOf(entry.engagementId ?? 'general')}
                  </span>
                </div>
                <div className='grid justify-items-end gap-0.5'>
                  <span className='num'>
                    {t('time.hoursShort', { h: hours(entry.minutes) })}
                  </span>
                  <span className='text-[11px] text-muted-foreground'>
                    {entry.billable
                      ? t('common.billable')
                      : t('common.notBillable')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  )
}
