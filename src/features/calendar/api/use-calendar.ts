import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import type {
  CalendarEventInput,
  ImportantDateInput,
} from '../model/calendar.schema'

const saved = z.object({ id: z.string() })

/** Adds a manual event, or edits one when `id` is given. */
export const useSaveEvent = () =>
  useAction(({ id, ...body }: CalendarEventInput & { id?: string }) =>
    id
      ? callApi('PUT', `/calendar-events/${seg(id)}`, saved, body)
      : callApi('POST', '/calendar-events', saved, body)
  )

export const useDeleteEvent = () =>
  useAction((id: string) =>
    callApi('DELETE', `/calendar-events/${seg(id)}`, saved)
  )

/** Adds an important date, or edits one when `id` is given. */
export const useSaveImportantDate = () =>
  useAction(({ id, ...body }: ImportantDateInput & { id?: string }) =>
    id
      ? callApi('PUT', `/important-dates/${seg(id)}`, saved, body)
      : callApi('POST', '/important-dates', saved, body)
  )

/** "Renewed / done": a recurring date moves on one period. */
export const useHandleImportantDate = () =>
  useAction((id: string) =>
    callApi('POST', `/important-dates/${seg(id)}/handled`, saved)
  )

export const useArchiveImportantDate = () =>
  useAction((id: string) =>
    callApi('POST', `/important-dates/${seg(id)}/archive`, saved)
  )
