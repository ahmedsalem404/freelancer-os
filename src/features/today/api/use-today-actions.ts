import { useAction } from '@/app/client/use-action'
import { callApi, seg } from '@/shared/http/api-client'
import { z } from 'zod'
import type { AddTaskInput, SaveReflectionInput } from '../model/today.schema'

export const useAddTask = () =>
  useAction((input: AddTaskInput) =>
    callApi('POST', '/tasks', z.object({ id: z.string() }), input)
  )

export const useToggleTask = () =>
  useAction((taskId: string) =>
    callApi(
      'POST',
      `/tasks/${seg(taskId)}/toggle`,
      z.object({ completed: z.boolean() })
    )
  )

/** Save today's reflection and carry unfinished tasks over, atomically. */
export const useCloseDay = () =>
  useAction((input: SaveReflectionInput) =>
    callApi(
      'POST',
      '/day/close',
      z.object({ day: z.string(), moved: z.number().int() }),
      input
    )
  )
