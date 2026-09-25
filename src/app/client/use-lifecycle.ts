import { z } from 'zod'
import { callApi, seg } from '@/shared/http/api-client'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAction } from './use-action'

type Resource = 'clients' | 'engagements'
type Action = 'archive' | 'unarchive' | 'delete'

const done = z.object({ id: z.string() })

const DONE_KEY: Record<Action, string> = {
  archive: 'common.archivedDone',
  unarchive: 'common.unarchivedDone',
  delete: 'common.deletedDone',
}

/**
 * Archive, restore and delete for a client or an engagement — the props
 * `ArchiveActions` expects. Failures toast through the global handler.
 */
export function useLifecycle(
  resource: Resource,
  id: string,
  { onDeleted }: { onDeleted: () => void }
) {
  const { t } = useTranslation()
  const action = useAction((kind: Action) =>
    kind === 'delete'
      ? callApi('DELETE', `/${resource}/${seg(id)}`, done)
      : callApi('POST', `/${resource}/${seg(id)}/${kind}`, done)
  )
  const run = (kind: Action) =>
    action.mutate(kind, {
      onSuccess: () => {
        toast.success(t(DONE_KEY[kind]))
        if (kind === 'delete') onDeleted()
      },
    })

  return {
    isPending: action.isPending,
    onArchive: () => run('archive'),
    onUnarchive: () => run('unarchive'),
    onDelete: () => run('delete'),
  }
}
