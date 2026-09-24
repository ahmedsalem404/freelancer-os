import { useDb } from '@/app/client/snapshot-query'
import { todayIso } from '@/shared/model/dates'
import { useToggleStage } from './api/use-engagement-actions'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  Plus,
  Upload,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useDateFormat } from '@/lib/dates'
import {
  deliverablesOf,
  engagementCurrentValue,
  engagementMeter,
  invoicePaid,
  scopeGuard,
} from '@/domain/selectors'
import type { Engagement } from '@/domain/types'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AllowanceMeter } from '@/components/fos/allowance-meter'
import { TypeBadge } from '@/components/fos/badges'
import { InvoiceTable } from '@/components/fos/invoice-table'
import { Money } from '@/components/fos/money'
import {
  EmptyState,
  PageShell,
  Panel,
  StatTile,
} from '@/components/fos/page'
import { DeliverableCard } from './deliverable-card'
import { ChangeScopeDialog } from './ui/change-scope-dialog'
import { CyclePanel } from './ui/cycle-panel'
import { RetainerPanel } from './ui/retainer-panel'

export function EngagementDetail({ id }: { id: string }) {
  const { t } = useTranslation()
  const engagement = useDb().engagements.find((e) => e.id === id)
  if (!engagement) {
    return (
      <PageShell title={t('common.noResults')}>
        <EmptyState>{t('common.empty')}</EmptyState>
      </PageShell>
    )
  }
  return <EngagementView engagement={engagement} />
}

function EngagementView({ engagement: e }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const db = useDb()
  const [isScopeOpen, setIsScopeOpen] = useState(false)
  const client = db.clients.find((c) => c.id === e.clientId)!
  const meter = engagementMeter(db, e, todayIso())
  const scope = scopeGuard(db, e)
  const firstTab =
    e.type === 'project' ? 'work' : e.type === 'retainer' ? 'usage' : 'cycle'

  return (
    <PageShell
      eyebrow={
        <Link
          to='/clients/$id'
          params={{ id: client.id }}
          className='inline-flex items-center gap-2 hover:text-foreground'
        >
          <span
            className='size-2 rounded-full'
            style={{ backgroundColor: client.color }}
          />
          {client.company ?? client.name}
        </Link>
      }
      title={
        <span className='flex flex-wrap items-center gap-3'>
          {e.title} <TypeBadge type={e.type} />
        </span>
      }
      subtitle={e.nextAction}
      actions={
        <>
          <Button asChild variant='outline' size='sm'>
            <Link to='/engagements'>
              <ArrowRight className='ltr:rotate-180' /> {t('common.back')}
            </Link>
          </Button>
          {e.type === 'project' && (
            <Button size='sm' onClick={() => setIsScopeOpen(true)}>
              <Plus /> {t('engagements.changeScope')}
            </Button>
          )}
        </>
      }
    >
      <div className='grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8'>
        <AllowanceMeter meter={meter} />
        <div className='grid gap-0.5 sm:text-end'>
          <span className='text-xs text-muted-foreground'>
            {t('engagements.contractValue')}
          </span>
          <Money
            amount={engagementCurrentValue(db, e)}
            currency={e.currency}
            rateToBase={e.rateToBase}
            showBase
            className='text-xl font-semibold'
          />
        </div>
      </div>

      {scope.extras > 0 && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl bg-billable-soft p-4 text-sm ring-1 ring-billable/50'>
          <span className='text-billable-foreground dark:text-billable'>
            {t('guard.scopeBanner', {
              tracked: scope.tracked,
              agreed: scope.agreed,
            })}
          </span>
          <Button
            size='sm'
            className='bg-billable text-[#241a00] hover:bg-billable/90'
            onClick={() => setIsScopeOpen(true)}
          >
            {t('guard.billScope')}
          </Button>
        </div>
      )}

      <Tabs defaultValue={firstTab} className='gap-4'>
        <div className='overflow-x-auto pb-1'>
          <TabsList>
            {e.type === 'project' && (
              <TabsTrigger value='work'>{t('engagements.tabs.work')}</TabsTrigger>
            )}
            {e.type === 'retainer' && (
              <TabsTrigger value='usage'>
                {t('engagements.tabs.usage')}
              </TabsTrigger>
            )}
            {e.type === 'subscription' && (
              <TabsTrigger value='cycle'>
                {t('engagements.tabs.cycle')}
              </TabsTrigger>
            )}
            <TabsTrigger value='money'>{t('engagements.tabs.money')}</TabsTrigger>
            <TabsTrigger value='time'>{t('engagements.tabs.time')}</TabsTrigger>
            <TabsTrigger value='files'>{t('engagements.tabs.files')}</TabsTrigger>
          </TabsList>
        </div>

        {e.type === 'project' && (
          <TabsContent
            value='work'
            className='grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]'
          >
            <StagesPanel engagementId={e.id} />
            <div className='grid content-start gap-3'>
              {deliverablesOf(db, e.id).map((d) => (
                <DeliverableCard key={d.id} deliverable={d} engagement={e} />
              ))}
              <ClientLinkPanel engagementId={e.id} />
            </div>
          </TabsContent>
        )}
        {e.type === 'retainer' && (
          <TabsContent value='usage'>
            <RetainerPanel engagement={e} />
          </TabsContent>
        )}
        {e.type === 'subscription' && (
          <TabsContent value='cycle'>
            <CyclePanel engagement={e} />
          </TabsContent>
        )}
        <TabsContent value='money'>
          <MoneyTab engagement={e} />
        </TabsContent>
        <TabsContent value='time'>
          <TimeTab engagementId={e.id} />
        </TabsContent>
        <TabsContent value='files'>
          <FilesTab engagementId={e.id} />
        </TabsContent>
      </Tabs>

      <ChangeScopeDialog
        engagement={e}
        open={isScopeOpen}
        onOpenChange={setIsScopeOpen}
      />
    </PageShell>
  )
}

function StagesPanel({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const stages = useDb().stages
  const toggleStage = useToggleStage()
  const list = stages
    .filter((s) => s.engagementId === engagementId)
    .sort((a, b) => a.position - b.position)
  const currentIndex = list.findIndex((s) => !s.completedAt)

  return (
    <Panel title={t('engagements.stages')} className='h-fit' bodyClassName='p-2'>
      <ol className='grid'>
        {list.map((stage, index) => (
          <li key={stage.id}>
            <button
              onClick={() => toggleStage.mutate(stage.id)}
              className='flex w-full items-center gap-3 rounded-md px-2 py-2 text-start text-sm hover:bg-accent/40'
            >
              <span
                className={cn(
                  'num grid size-6 shrink-0 place-items-center rounded-full border text-[11px]',
                  stage.completedAt &&
                    'border-primary bg-primary text-primary-foreground',
                  index === currentIndex &&
                    'border-primary text-primary ring-2 ring-primary/20'
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  stage.completedAt && 'text-muted-foreground line-through'
                )}
              >
                {stage.title}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

function ClientLinkPanel({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const url = `${window.location.origin}/p/${engagementId}`
  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4 text-sm'>
      <div className='grid gap-0.5'>
        <span className='flex items-center gap-2 font-medium'>
          <Link2 className='size-4' /> {t('engagements.clientLink')}
        </span>
        <span className='text-xs text-muted-foreground'>
          {t('engagements.clientLinkHint')}
        </span>
      </div>
      <div className='flex gap-2'>
        <Button
          size='sm'
          variant='outline'
          onClick={() => {
            void navigator.clipboard?.writeText(url)
            toast.success(t('common.copied'))
          }}
        >
          {t('common.copy')}
        </Button>
        <Button asChild size='sm' variant='ghost'>
          <a
            href={`/p/${engagementId}`}
            target='_blank'
            rel='noopener noreferrer'
          >
            <ExternalLink /> {t('common.open')}
          </a>
        </Button>
      </div>
    </div>
  )
}

function MoneyTab({ engagement: e }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const db = useDb()
  const invoices = db.invoices.filter((i) => i.engagementId === e.id)
  const invoiced = invoices
    .filter((i) => i.state === 'issued')
    .reduce((s, i) => s + i.amount, 0)
  const collected = invoices.reduce((s, i) => s + invoicePaid(db, i.id), 0)

  return (
    <div className='grid gap-4'>
      <div className='grid gap-3 sm:grid-cols-3'>
        <StatTile
          label={t('engagements.contractValue')}
          value={
            <Money amount={engagementCurrentValue(db, e)} currency={e.currency} />
          }
        />
        <StatTile
          label={t('engagements.invoiced')}
          value={<Money amount={invoiced} currency={e.currency} />}
        />
        <StatTile
          label={t('engagements.collected')}
          value={<Money amount={collected} currency={e.currency} />}
        />
      </div>
      <Panel bodyClassName='p-0'>
        <InvoiceTable invoices={invoices} showClient={false} />
      </Panel>
    </div>
  )
}

function TimeTab({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const timeEntries = useDb().timeEntries
  const team = useDb().team
  const entries = timeEntries.filter((x) => x.engagementId === engagementId)
  if (entries.length === 0) return <EmptyState>{t('common.empty')}</EmptyState>
  return (
    <Panel bodyClassName='p-0'>
      <ul className='divide-y'>
        {entries.map((entry) => (
          <li
            key={entry.id}
            className='flex items-center justify-between gap-3 px-4 py-3 text-sm'
          >
            <div className='grid gap-0.5'>
              <span>{entry.description}</span>
              <span className='text-xs text-muted-foreground'>
                {fmt(entry.workOn)} ·{' '}
                {team.find((m) => m.id === entry.memberId)?.name}
              </span>
            </div>
            <span className='num text-muted-foreground'>
              {t('time.hoursShort', {
                h: Math.round((entry.minutes / 60) * 10) / 10,
              })}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function FilesTab({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const attachments = useDb().attachments
  const files = attachments.filter((a) => a.engagementId === engagementId)
  return (
    <Panel
      title={t('engagements.attachments')}
      action={
        <Button
          size='sm'
          variant='outline'
          onClick={() => toast(t('settings.backendSoon'))}
        >
          <Upload /> {t('common.upload')}
        </Button>
      }
    >
      <p className='mb-3 text-xs text-muted-foreground'>
        {t('engagements.attachmentsHint')}
      </p>
      {files.length === 0 ? (
        <EmptyState>{t('engagements.noAttachments')}</EmptyState>
      ) : (
        <ul className='grid gap-2 sm:grid-cols-2'>
          {files.map((file) => (
            <li
              key={file.id}
              className='flex items-center gap-3 rounded-lg border p-3 text-sm'
            >
              {file.kind === 'agreement_chat' ? (
                <ImageIcon className='size-5 text-chart-3' />
              ) : (
                <FileText className='size-5 text-primary' />
              )}
              <div className='grid min-w-0 gap-0.5'>
                <span className='truncate'>{file.fileName}</span>
                <span className='text-xs text-muted-foreground'>
                  {t(`engagements.attachmentKind.${file.kind}`)} ·{' '}
                  {fmt(file.uploadedOn)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
