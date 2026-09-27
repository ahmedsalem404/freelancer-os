/** Server-side public surface of `auth` (ARCHITECTURE.md §3). */
export { authGate, sessionMember } from './auth-gate'
export { createAuthRoutes } from './auth.routes'
export { PASSWORD_MAX, PASSWORD_MIN } from '../model/auth.schema'
export { hashPassword } from './password'
export { replacePassword, startSession } from './sessions.service'
export { teamRoutes } from './team.routes'
