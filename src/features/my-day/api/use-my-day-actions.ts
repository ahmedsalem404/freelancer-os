import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { callApi, seg } from '@/shared/http/api-client'
import type { LogTimeInput } from '@/features/time/model/time.schema'
import type {
  AddTaskInput,
  SaveReflectionInput,
} from '@/features/today/model/today.schema'
import { workspaceQuery } from './workspace-query'

/** A write from "My day": refetches the workspace before `onSuccess`. */
function useWorkspaceAction<TVars, TResult>(
  mutationFn: (vars: TVars) => Promise<TResult>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspaceQuery.queryKey }),
  })
}

const idResult = z.object({ id: z.string() })

export const useAddMyTask = () =>
  useWorkspaceAction((input: AddTaskInput) =>
    callApi('POST', '/tasks', idResult, input)
  )

export const useToggleMyTask = () =>
  useWorkspaceAction((taskId: string) =>
    callApi(
      'POST',
      `/tasks/${seg(taskId)}/toggle`,
      z.object({ completed: z.boolean() })
    )
  )

export const useLogMyTime = () =>
  useWorkspaceAction((input: LogTimeInput) =>
    callApi('POST', '/time', idResult, input)
  )

export const useCloseMyDay = () =>
  useWorkspaceAction((input: SaveReflectionInput) =>
    callApi(
      'POST',
      '/day/close',
      z.object({ day: z.string(), moved: z.number().int() }),
      input
    )
  )
