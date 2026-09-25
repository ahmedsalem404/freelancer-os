import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageShell } from '@/app/client/layout/page-shell'
import { useDb } from '@/app/client/snapshot-query'
import { useLifecycle } from '@/app/client/use-lifecycle'
import { ArchiveActions } from '@/shared/components/archive-actions'
import { EmptyState } from '@/shared/components/empty-state'
import { isArchived } from '@/shared/model/archive'
import { todayIso } from '@/shared/model/dates'
import { ArrowRight, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import {
  deliverablesOf,
  engagementCurrentValue,
  scopeGuard,
} from '@/features/engagements/model/guard'
import { engagementMeter } from '@/features/engagements/model/meter'
import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { TypeBadge } from '@/features/engagements/ui/badges'
import { ClientLinkPanel } from '@/features/portal'
import { Money } from '@/features/rates/ui/money'
import { ChangeScopeDialog } from './change-scope-dialog'
import { CyclePanel } from './cycle-panel'
import { DeliverableCard } from './deliverable-card'
import { EditEngagementDialog } from './edit-engagement-dialog'
import { FilesTab, MoneyTab, TimeTab } from './engagement-tabs'
import { RetainerPanel } from './retainer-panel'
import { StagesPanel } from './stages-panel'

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
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()
  const lifecycle = useLifecycle('engagements', e.id, {
    onDeleted: () => navigate({ to: '/engagements' }),
  })
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
          <Button
            variant='outline'
            size='sm'
            onClick={() => setIsEditing(true)}
          >
            <Pencil /> {t('engagements.edit')}
          </Button>
          {e.type === 'project' && (
            <Button size='sm' onClick={() => setIsScopeOpen(true)}>
              <Plus /> {t('engagements.changeScope')}
            </Button>
          )}
          <ArchiveActions
            name={e.title}
            isArchived={isArchived(e)}
            {...lifecycle}
          />
        </>
      }
    >
      {isArchived(e) && (
        <p className='rounded-lg border border-dashed px-4 py-2 text-sm text-muted-foreground'>
          {t('common.archivedNote')}
        </p>
      )}
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
              <TabsTrigger value='work'>
                {t('engagements.tabs.work')}
              </TabsTrigger>
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
            <TabsTrigger value='money'>
              {t('engagements.tabs.money')}
            </TabsTrigger>
            <TabsTrigger value='time'>{t('engagements.tabs.time')}</TabsTrigger>
            <TabsTrigger value='files'>
              {t('engagements.tabs.files')}
            </TabsTrigger>
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
      {isEditing && (
        <EditEngagementDialog
          engagement={e}
          onClose={() => setIsEditing(false)}
        />
      )}
    </PageShell>
  )
}
