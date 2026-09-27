import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import { and, eq, ne } from 'drizzle-orm'
import { teamMembers } from '@/features/settings/server'
import type { AssistantInput } from '../model/team.input'
import { byLogin } from './sessions.service'
import { authSessions } from './sessions.table'

/** The owner manages assistants here; their own account is "My account". */
function assistantOf(ctx: Ctx, id: string) {
  const member = required(
    ctx.db.select().from(teamMembers).where(eq(teamMembers.id, id)).get(),
    'Team member',
    id
  )
  if (member.role !== 'assistant') {
    throw new DomainError(
      'not_an_assistant',
      'Edit your own account in My account',
      409
    )
  }
  return member
}

function assertLoginFree(ctx: Ctx, login: string, exceptId = '') {
  const taken = ctx.db
    .select({ id: teamMembers.id })
    .from(teamMembers)
    .where(and(byLogin(login), ne(teamMembers.id, exceptId)))
    .get()
  if (taken) {
    throw new DomainError('login_taken', 'Another member uses this login', 409)
  }
}

const signOutEverywhere = (ctx: Ctx, memberId: string) =>
  ctx.db.delete(authSessions).where(eq(authSessions.memberId, memberId)).run()

export function addAssistant(
  ctx: Ctx,
  input: AssistantInput & { passwordHash: string }
) {
  assertLoginFree(ctx, input.login)
  const id = newId('m')
  ctx.db
    .insert(teamMembers)
    .values({
      id,
      name: input.name,
      role: 'assistant',
      email: input.login,
      passwordHash: input.passwordHash,
    })
    .run()
  return { id }
}

export function updateAssistant(ctx: Ctx, id: string, input: AssistantInput) {
  assistantOf(ctx, id)
  assertLoginFree(ctx, input.login, id)
  ctx.db
    .update(teamMembers)
    .set({ name: input.name, email: input.login })
    .where(eq(teamMembers.id, id))
    .run()
  return { id }
}

/** A new password signs the assistant out on every device. */
export function resetAssistantPassword(
  ctx: Ctx,
  id: string,
  passwordHash: string
) {
  assistantOf(ctx, id)
  ctx.db
    .update(teamMembers)
    .set({ passwordHash })
    .where(eq(teamMembers.id, id))
    .run()
  signOutEverywhere(ctx, id)
  return { id }
}

/** A stopped assistant can't sign in and is signed out now; nothing is lost. */
export function setAssistantActive(ctx: Ctx, id: string, isActive: boolean) {
  assistantOf(ctx, id)
  ctx.db
    .update(teamMembers)
    .set({ isActive })
    .where(eq(teamMembers.id, id))
    .run()
  if (!isActive) signOutEverywhere(ctx, id)
  return { id, isActive }
}
