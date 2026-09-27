import { z } from 'zod'
import { PASSWORD_MAX, PASSWORD_MIN } from './auth.schema'

const password = z.string().min(PASSWORD_MIN).max(PASSWORD_MAX)
const name = z.string().trim().min(1).max(80)
const login = z.string().trim().min(1).max(254)

/** Body of `POST /api/team`: the owner adds an assistant with a password. */
export const newAssistantInput = z.object({ name, login, password })

/** Body of `PUT /api/team/:id`. */
export const assistantInput = z.object({ name, login })

/** Body of `PUT /api/team/:id/password` (the owner resets it). */
export const resetPasswordInput = z.object({ password })

export type NewAssistantInput = z.infer<typeof newAssistantInput>
export type AssistantInput = z.infer<typeof assistantInput>
