import { clientCollectedBase, clientHealth, clientOutstandingBase } from '@/features/clients/model/client-health'
import { engagementMeter } from '@/features/engagements/model/meter'
import type { Client } from '@/features/clients/model/clients.schema'
import { useRevealSecret } from './api/use-reveal-secret'
import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Eye, EyeOff, KeyRound, MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useDateFormat } from '@/lib/dates'
import { waLink } from '@/lib/whatsapp'
import { Button } from '@/components/ui/button'
import { AllowanceMeter } from '@/components/fos/allowance-meter'
import { HealthBadge, TypeBadge } from '@/components/fos/badges'
import { InvoiceTable } from '@/components/fos/invoice-table'
import { BaseMoney } from '@/components/fos/money'
import { EmptyState, PageShell, Panel, StatTile } from '@/components/fos/page'

const REVEAL_MS = 10_000

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
        <Button asChild variant='outline' size='sm'>
          <a
            href={waLink(client.whatsapp, '')}
            target='_blank'
            rel='noopener noreferrer'
          >
            <MessageCircle /> WhatsApp
          </a>
        </Button>
      }
    >
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
              value={<span className='num'>+{client.whatsapp}</span>}
            />
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

function VaultPanel({ clientId }: { clientId: string }) {
  const { t } = useTranslation()
  const vault = useDb().vault
  const reveal = useRevealSecret()
  const [revealed, setRevealed] = useState<{ id: string; secret: string }>()
  const entries = vault.filter((v) => v.clientId === clientId)

  useEffect(() => {
    if (!revealed) return
    const timer = setTimeout(() => setRevealed(undefined), REVEAL_MS)
    return () => clearTimeout(timer)
  }, [revealed])

  return (
    <Panel
      title={
        <span className='flex items-center gap-2'>
          <KeyRound className='size-4' /> {t('clients.vault')}
        </span>
      }
    >
      <p className='mb-3 text-xs text-muted-foreground'>
        {t('clients.vaultHint')}
      </p>
      {entries.length === 0 ? (
        <EmptyState>{t('clients.noVault')}</EmptyState>
      ) : (
        <ul className='grid gap-2'>
          {entries.map((entry) => {
            const isShown = revealed?.id === entry.id
            return (
              <li
                key={entry.id}
                className='grid gap-1 rounded-lg border p-3 text-sm'
              >
                <div className='flex items-center justify-between'>
                  <span className='font-medium'>{entry.label}</span>
                  <Button
                    size='sm'
                    variant='ghost'
                    disabled={reveal.isPending}
                    onClick={() =>
                      isShown
                        ? setRevealed(undefined)
                        : reveal.mutate(entry.id, {
                            onSuccess: ({ secret }) =>
                              setRevealed({ id: entry.id, secret }),
                          })
                    }
                  >
                    {isShown ? <EyeOff /> : <Eye />}
                    {isShown ? t('common.hide') : t('common.show')}
                  </Button>
                </div>
                <div className='num text-xs text-muted-foreground'>
                  {entry.username}
                </div>
                <div className='num text-sm'>
                  {isShown ? revealed.secret : '••••••••••'}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
