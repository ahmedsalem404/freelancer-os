import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { Plus } from 'lucide-react'
import { motion } from 'motion/react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  clientCollectedBase,
  clientHealth,
  clientOutstandingBase,
} from '@/features/clients/model/client-health'
import { HealthBadge } from '@/features/clients/ui/health-badge'
import { BaseMoney } from '@/features/rates/ui/money'
import { ClientFormDialog } from './ui/client-form-dialog'

export function Clients() {
  const { t } = useTranslation()
  const db = useDb()
  const now = todayIso()
  const [isAdding, setIsAdding] = useState(false)

  return (
    <PageShell
      title={t('clients.title')}
      subtitle={t('clients.count', { count: db.clients.length })}
      actions={
        <Button size='sm' onClick={() => setIsAdding(true)}>
          <Plus /> {t('clients.add')}
        </Button>
      }
    >
      {isAdding && <ClientFormDialog onClose={() => setIsAdding(false)} />}
      <div className='overflow-x-auto rounded-xl border bg-card'>
        <table className='w-full min-w-[720px] text-sm'>
          <thead className='text-xs text-muted-foreground'>
            <tr className='border-b'>
              <th className='px-4 py-3 text-start font-medium'>
                {t('common.client')}
              </th>
              <th className='px-4 py-3 text-start font-medium'>
                {t('clients.engagements')}
              </th>
              <th className='px-4 py-3 text-start font-medium'>
                {t('clients.identity')}
              </th>
              <th className='px-4 py-3 text-start font-medium'>
                {t('clients.health')}
              </th>
              <th className='px-4 py-3 text-end font-medium'>
                {t('clients.revenue')}
              </th>
              <th className='px-4 py-3 text-end font-medium'>
                {t('clients.outstanding')}
              </th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {db.clients.map((client, index) => {
              const engagements = db.engagements.filter(
                (e) => e.clientId === client.id
              )
              const identity = db.identities.find(
                (i) => i.id === client.billingIdentityId
              )
              const outstanding = clientOutstandingBase(db, client.id, now)
              return (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  className='transition-colors hover:bg-accent/30'
                >
                  <td className='px-4 py-3'>
                    <Link
                      to='/clients/$id'
                      params={{ id: client.id }}
                      className='flex items-center gap-3'
                    >
                      <span
                        className='grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white'
                        style={{ backgroundColor: client.color }}
                      >
                        {(client.company ?? client.name).slice(0, 1)}
                      </span>
                      <span className='grid'>
                        <span className='font-medium hover:underline'>
                          {client.company ?? client.name}
                        </span>
                        <span className='text-xs text-muted-foreground'>
                          {client.company ? client.name : t('clients.person')} ·{' '}
                          {client.city}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex flex-wrap gap-1'>
                      {engagements.map((e) => (
                        <span
                          key={e.id}
                          className='rounded-full bg-muted px-2 py-0.5 text-xs'
                        >
                          {t(`types.${e.type}`)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className='px-4 py-3 text-muted-foreground'>
                    {identity?.name}
                  </td>
                  <td className='px-4 py-3'>
                    <HealthBadge health={clientHealth(db, client.id, now)} />
                  </td>
                  <td className='px-4 py-3 text-end'>
                    <BaseMoney base={clientCollectedBase(db, client.id)} />
                  </td>
                  <td className='px-4 py-3 text-end'>
                    {outstanding > 0 ? (
                      <BaseMoney base={outstanding} className='text-overdue' />
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
