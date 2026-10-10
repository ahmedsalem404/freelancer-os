import { useTranslation } from 'react-i18next'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { CyclePanel } from './cycle-panel'
import { MoneyTab } from './engagement-tabs'
import { FilesTab } from './files-tab'
import { WorkTab } from './work-tab'

/** The engagement's sections; the first one depends on its type. */
export function EngagementTabList({
  engagement: e,
}: {
  engagement: Engagement
}) {
  const { t } = useTranslation()
  const firstTab = e.type === 'project' ? 'work' : 'cycle'

  return (
    <Tabs defaultValue={firstTab} className='gap-4'>
      <div className='overflow-x-auto pb-1'>
        <TabsList>
          {e.type === 'project' && (
            <TabsTrigger value='work'>{t('engagements.tabs.work')}</TabsTrigger>
          )}
          {e.type === 'subscription' && (
            <TabsTrigger value='cycle'>
              {t('engagements.tabs.cycle')}
            </TabsTrigger>
          )}
          <TabsTrigger value='money'>{t('engagements.tabs.money')}</TabsTrigger>
          <TabsTrigger value='files'>{t('engagements.tabs.files')}</TabsTrigger>
        </TabsList>
      </div>

      {e.type === 'project' && (
        <TabsContent value='work'>
          <WorkTab engagement={e} />
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
      <TabsContent value='files'>
        <FilesTab engagementId={e.id} />
      </TabsContent>
    </Tabs>
  )
}
