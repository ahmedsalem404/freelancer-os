import { isoDate, isoDateTime, recordId } from '@/shared/model/schema'
import { z } from 'zod'

export const taskSchema = z.object({
  id: recordId,
  title: z.string(),
  engagementId: recordId.optional(),
  assigneeId: recordId,
  dueOn: isoDate.optional(),
  completedAt: isoDateTime.optional(),
})

export const reflectionSchema = z.object({
  id: recordId,
  memberId: recordId,
  day: isoDate,
  note: z.string(),
})

/** Body of `POST /api/tasks`. */
export const addTaskInput = z.object({
  title: z.string().trim().min(1).max(300),
  engagementId: recordId.optional(),
})

/** Body of `PUT /api/reflections/today`. */
export const saveReflectionInput = z.object({
  note: z.string().trim().max(4000),
})

export type Task = z.infer<typeof taskSchema>
export type DailyReflection = z.infer<typeof reflectionSchema>
export type AddTaskInput = z.infer<typeof addTaskInput>
export type SaveReflectionInput = z.infer<typeof saveReflectionInput>
