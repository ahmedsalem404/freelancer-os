import { parseRows } from '@/shared/model/schema'
import { afterEach, describe, expect, it } from 'vitest'
import { workspaceSchema } from '@/features/my-day/model/workspace.schema'
import { ASSISTANT_ID, createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

/** The owner gives the assistant a task on an engagement. */
async function assign(title: string, engagementId?: string) {
  const res = await t.call('POST', '/tasks', {
    title,
    engagementId,
    assigneeId: ASSISTANT_ID,
  })
  expect(res.status).toBe(201)
  return String(res.json.data.id)
}

function asAssistant() {
  const token = t.sessionFor(ASSISTANT_ID)
  return (method: string, path: string, body?: unknown) =>
    t.callAs(token, method, path, body)
}

describe('assistant workspace', () => {
  it('shows only their tasks and the titles of those engagements — no money', async () => {
    t = createTestApp()
    await assign('صمم الغلاف', 'e-nakhla')
    const call = asAssistant()
    const res = await call('GET', '/workspace')
    expect(res.status).toBe(200)
    const [workspace] = parseRows(workspaceSchema, [res.json.data])
    expect(workspace?.tasks.map((task) => task.title)).toContain('صمم الغلاف')
    // Only engagements of their tasks (the demo already gives them one).
    const ids = workspace?.engagements.map((e) => e.id) ?? []
    expect(ids).toContain('e-nakhla')
    expect(ids.length).toBeLessThanOrEqual(2)
    const raw = JSON.stringify(res.json.data)
    for (const secret of ['amount', 'currency', 'whatsapp', 'invoice', 'c-']) {
      expect(raw).not.toContain(secret)
    }
  })

  it('lets them tick their own task but not the owner’s', async () => {
    t = createTestApp()
    const theirs = await assign('مهمتها')
    const owners = await t.call('POST', '/tasks', { title: 'مهمة المالك' })
    const call = asAssistant()
    expect((await call('POST', `/tasks/${theirs}/toggle`)).status).toBe(200)
    const other = await call('POST', `/tasks/${owners.json.data.id}/toggle`)
    expect(other.status).toBe(404)
  })

  it('adds tasks for themselves only', async () => {
    t = createTestApp()
    const call = asAssistant()
    const own = await call('POST', '/tasks', { title: 'مهمة جديدة' })
    const forOwner = await call('POST', '/tasks', {
      title: 'x',
      assigneeId: 'm-owner',
    })
    expect([own.status, forOwner.status]).toEqual([201, 403])
  })

  it('closes their day: note saved, their open tasks move to tomorrow', async () => {
    t = createTestApp()
    await assign('لم تكتمل')
    const call = asAssistant()
    const res = await call('POST', '/day/close', { note: 'يوم جيد' })
    expect(res.status).toBe(200)
    expect(res.json.data).toMatchObject({ moved: 1 })
    const ws = await call('GET', '/workspace')
    expect(ws.json.data.reflection).toBe('يوم جيد')
  })

  it('still cannot reach money, clients or settings', async () => {
    t = createTestApp()
    const call = asAssistant()
    for (const [method, path] of [
      ['GET', '/snapshot'],
      ['POST', '/engagements/e-nakhla/renew'],
      ['PUT', '/rates/today'],
      ['POST', '/clients'],
    ]) {
      expect((await call(method, path)).status, path).toBe(403)
    }
  })
})

describe('owner assigning tasks', () => {
  it('refuses an unknown member', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/tasks', {
      title: 'x',
      assigneeId: 'm-nobody',
    })
    expect(res.status).toBe(404)
  })
})
