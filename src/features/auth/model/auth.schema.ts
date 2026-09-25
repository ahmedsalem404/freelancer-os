import { z } from 'zod'
import { TEAM_ROLES } from '@/features/settings/model/enums'

/**
 * Password length the owner may choose. The owner asked for freedom (no
 * complexity rules); the floor only blocks an empty or one-key password,
 * the ceiling bounds hashing work.
 */
export const PASSWORD_MIN = 4
export const PASSWORD_MAX = 200
/** Login name: an email or any name the member picks (stored in `email`). */
const LOGIN_MAX = 254
const NAME_MAX = 80

const login = z.string().trim().min(1).max(LOGIN_MAX)

/** Body of `POST /api/auth/sign-in`. */
export const signInInput = z.object({
  login,
  password: z.string().min(1).max(PASSWORD_MAX),
})

/** Body of `PUT /api/auth/account`: the signed-in member edits themselves. */
export const accountInput = z.object({
  /** Proves it is the member at the keyboard, not someone at an open tab. */
  currentPassword: z.string().min(1).max(PASSWORD_MAX),
  name: z.string().trim().min(1).max(NAME_MAX),
  login,
  /** Omitted or empty: keep the current password. */
  newPassword: z
    .string()
    .max(PASSWORD_MAX)
    .refine((v) => v === '' || v.length >= PASSWORD_MIN)
    .optional(),
})

/** The signed-in member, as `GET /api/auth/me` answers it. */
export const sessionMemberSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(TEAM_ROLES),
  /** The login name (an email or any name). */
  email: z.string(),
})

export type SignInInput = z.infer<typeof signInInput>
export type AccountInput = z.infer<typeof accountInput>
export type SessionMember = z.infer<typeof sessionMemberSchema>
