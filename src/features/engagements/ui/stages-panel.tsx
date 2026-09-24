import { useDb } from '@/app/client/snapshot-query'
import { Panel } from '@/shared/components/panel'
import { cn } from '@/shared/lib/utils'
import { useTranslation } from 'react-i18next'
import { useToggleStage } from '../api/use-engagement-actions'

export function StagesPanel({ engagementId }: { engagementId: string }) {
  const { t } = useTranslation()
  const stages = useDb().stages
  const toggleStage = useToggleStage()
  const list = stages
    .filter((s) => s.engagementId === engagementId)
    .sort((a, b) => a.position - b.position)
  const currentIndex = list.findIndex((s) => !s.completedAt)

  return (
    <Panel
      title={t('engagements.stages')}
      className='h-fit'
      bodyClassName='p-2'
    >
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
