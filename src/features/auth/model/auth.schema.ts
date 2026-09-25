import { z } from 'zod'
import { TEAM_ROLES } from '@/features/settings/model/enums'

/** Longest email / password the sign-in form sends (bounds hashing work). */
const EMAIL_MAX = 254
const PASSWORD_INPUT_MAX = 200

/** Body of `POST /api/auth/sign-in`. */
export const signInInput = z.object({
  email: z.string().trim().min(3).max(EMAIL_MAX),
  password: z.string().min(1).max(PASSWORD_INPUT_MAX),
})

/** The signed-in member, as `GET /api/auth/me` answers it. */
export const sessionMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(TEAM_ROLES),
  email: z.string(),
})

export type SignInInput = z.infer<typeof signInInput>
export type SessionMember = z.infer<typeof sessionMemberSchema>
