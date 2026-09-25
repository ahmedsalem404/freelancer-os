import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { StatTile } from '@/shared/components/stat-tile'
import { useDateFormat } from '@/shared/lib/dates'
import { waLink } from '@/shared/lib/whatsapp'
import { todayIso } from '@/shared/model/dates'
import { MessageCircle, Pencil } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  clientCollectedBase,
  clientHealth,
  clientOutstandingBase,
} from '@/features/clients/model/client-health'
import type { Client } from '@/features/clients/model/clients.schema'
import { HealthBadge } from '@/features/clients/ui/health-badge'
import { engagementMeter } from '@/features/engagements/model/meter'
import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { TypeBadge } from '@/features/engagements/ui/badges'
import { InvoiceTable } from '@/features/invoices/ui/invoice-table'
import { BaseMoney } from '@/features/rates/ui/money'
import { ClientFormDialog } from './ui/client-form-dialog'
import { VaultPanel } from './ui/vault-panel'

export function ClientDetail({ id }: { id: string }) {
  const { t } = useTranslation()
  const client = useDb().clients.find((c) => c.id === id)
  if (!client) {
    return (
      <PageShell title={t('common.noResults')}>
        <EmptyState>{t('common.empty')}</EmptyState>
      </PageShell>
    )
  }
  return <ClientView client={client} />
}

function ClientView({ client }: { client: Client }) {
  const { t, i18n } = useTranslation()
  const fmt = useDateFormat()
  const db = useDb()
  const now = todayIso()
  const identity = db.identities.find((i) => i.id === client.billingIdentityId)
  const engagements = db.engagements.filter((e) => e.clientId === client.id)
  const invoices = db.invoices.filter((i) => i.clientId === client.id)
  const outstanding = clientOutstandingBase(db, client.id, now)
  const localTime = new Intl.DateTimeFormat(
    i18n.language === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn',
    { hour: '2-digit', minute: '2-digit', timeZone: client.timezone }
  ).format(new Date())
  const [isEditing, setIsEditing] = useState(false)

  return (
    <PageShell
      eyebrow={client.company ? client.name : t('clients.person')}
      title={
        <span className='flex items-center gap-3'>
          <span
            className='grid size-10 place-items-center rounded-full text-base text-white'
            style={{ backgroundColor: client.color }}
          >
            {(client.company ?? client.name).slice(0, 1)}
          </span>
          {client.company ?? client.name}
        </span>
      }
      actions={
        <>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsEditing(true)}
          >
            <Pencil /> {t('clients.edit')}
          </Button>
          {client.whatsapp && (
            <Button asChild variant='outline' size='sm'>
              <a
                href={waLink(client.whatsapp, '')}
                target='_blank'
                rel='noopener noreferrer'
              >
                <MessageCircle /> WhatsApp
              </a>
            </Button>
          )}
        </>
      }
    >
      {isEditing && (
        <ClientFormDialog client={client} onClose={() => setIsEditing(false)} />
      )}
      <div className='grid gap-3 sm:grid-cols-3'>
        <StatTile
          label={t('clients.revenue')}
          value={<BaseMoney base={clientCollectedBase(db, client.id)} />}
        />
        <StatTile
          tone={outstanding > 0 ? 'overdue' : 'default'}
          label={t('clients.outstanding')}
          value={<BaseMoney base={outstanding} />}
        />
        <StatTile
          label={t('clients.health')}
          value={<HealthBadge health={clientHealth(db, client.id, now)} />}
          hint={`${t('clients.since')} ${fmt(client.createdAt.slice(0, 10), 'MMMM yyyy')}`}
        />
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]'>
        <div className='grid content-start gap-4'>
          <Panel title={t('clients.engagements')} bodyClassName='p-0'>
            <ul className='divide-y'>
              {engagements.map((e) => (
                <li key={e.id}>
                  <Link
                    to='/engagements/$id'
                    params={{ id: e.id }}
                    className='grid gap-2 p-4 hover:bg-accent/40'
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-medium'>{e.title}</span>
                      <TypeBadge type={e.type} />
                    </div>
                    <AllowanceMeter
                      meter={engagementMeter(db, e, now)}
                      size='sm'
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title={t('clients.invoices')} bodyClassName='p-0'>
            <InvoiceTable invoices={invoices} showClient={false} />
          </Panel>
        </div>

        <div className='grid content-start gap-4'>
          <Panel bodyClassName='grid gap-3 text-sm'>
            <Row
              label='WhatsApp'
              value={
                client.whatsapp && (
                  <span className='num'>+{client.whatsapp}</span>
                )
              }
            />
            {client.email && (
              <Row
                label={t('clients.form.email')}
                value={<span dir='ltr'>{client.email}</span>}
              />
            )}
            <Row label={t('clients.city')} value={client.city} />
            <Row
              label={t('clients.localTime')}
              value={<span className='num'>{localTime}</span>}
            />
            <Row
              label={t('clients.currency')}
              value={<span className='num'>{client.currency}</span>}
            />
            <Row label={t('clients.identity')} value={identity?.name} />
            {client.notes && (
              <p className='border-t pt-3 whitespace-pre-line text-muted-foreground'>
                {client.notes}
              </p>
            )}
          </Panel>
          <VaultPanel clientId={client.id} />
        </div>
      </div>
    </PageShell>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-medium'>{value}</span>
    </div>
  )
}
