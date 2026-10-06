import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PageShell } from '@/app/client/layout/page-shell'
import { RecordNotFound } from '@/app/client/layout/record-not-found'
import { useDb } from '@/app/client/snapshot-query'
import { useLifecycle } from '@/app/client/use-lifecycle'
import { ArchiveActions } from '@/shared/components/archive-actions'
import { isArchived } from '@/shared/model/archive'
import { todayIso } from '@/shared/model/dates'
import { ArrowRight, Pencil, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import {
  engagementCurrentValue,
  scopeGuard,
} from '@/features/engagements/model/guard'
import { engagementMeter } from '@/features/engagements/model/meter'
import { AllowanceMeter } from '@/features/engagements/ui/allowance-meter'
import { TypeBadge } from '@/features/engagements/ui/badges'
import { Money } from '@/features/rates/ui/money'
import { ChangeScopeDialog } from './change-scope-dialog'
import { EditEngagementDialog } from './edit-engagement-dialog'
import { EditTermsDialog } from './edit-terms-dialog'
import { EngagementTabList } from './engagement-tab-list'

export function EngagementDetail({ id }: { id: string }) {
  const { t } = useTranslation()
  const engagement = useDb().engagements.find((e) => e.id === id)
  if (!engagement) {
    return (
      <RecordNotFound title={t('common.noResults')} backTo='/engagements' />
    )
  }
  return <EngagementView engagement={engagement} />
}

function EngagementView({ engagement: e }: { engagement: Engagement }) {
  const { t } = useTranslation()
  const db = useDb()
  const [isScopeOpen, setIsScopeOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isEditingTerms, setIsEditingTerms] = useState(false)
  const navigate = useNavigate()
  const lifecycle = useLifecycle('engagements', e.id, {
    onDeleted: () => navigate({ to: '/engagements' }),
  })
  const client = db.clients.find((c) => c.id === e.clientId)!
  const meter = engagementMeter(db, e, todayIso())
  const scope = scopeGuard(db, e)

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
        <div className='grid gap-0.5 sm:justify-items-end sm:text-end'>
          <span className='flex items-center gap-2 text-xs text-muted-foreground'>
            {t('engagements.contractValue')}
            <Button
              variant='link'
              size='sm'
              className='h-auto p-0 text-xs'
              onClick={() => setIsEditingTerms(true)}
            >
              {t('engagements.form.editTerms')}
            </Button>
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

      <EngagementTabList engagement={e} />

      <ChangeScopeDialog
        engagement={e}
        open={isScopeOpen}
        onOpenChange={setIsScopeOpen}
      />
      {isEditingTerms && (
        <EditTermsDialog
          engagement={e}
          onClose={() => setIsEditingTerms(false)}
        />
      )}
      {isEditing && (
        <EditEngagementDialog
          engagement={e}
          onClose={() => setIsEditing(false)}
        />
      )}
    </PageShell>
  )
}
