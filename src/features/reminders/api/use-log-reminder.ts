import { z } from 'zod'
import { useAction } from '@/app/client/use-action'
import { callApi } from '@/shared/http/api-client'
import type { ReminderActionInput } from '../model/reminder.schema'

/** Records that a reminder was sent (with its text) or dismissed. */
export const useLogReminder = () =>
  useAction((input: ReminderActionInput) =>
    callApi('POST', '/reminders', z.object({ logged: z.boolean() }), input)
  )
