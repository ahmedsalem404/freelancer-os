/** Server-side public surface of `auth` (ARCHITECTURE.md §3). */
export { authGate, sessionMember } from './auth-gate'
export { createAuthRoutes } from './auth.routes'
export { hashPassword, PASSWORD_MAX, PASSWORD_MIN } from './password'
export { replacePassword, startSession } from './sessions.service'
