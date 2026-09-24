import { addDaysIso, isoDay } from '@/shared/model/dates'
import { eq } from 'drizzle-orm'
import { afterEach, describe, expect, it } from 'vitest'
import { engagementMeter } from '@/features/engagements/model/meter'
import { leads } from '@/features/leads/server/leads.table'
import { createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

const today = isoDay(new Date())
const FULL_DAY = 24 * 60

describe('time', () => {
  it('logs retainer time against the allowance', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/time', {
      engagementId: 'e-masar',
      minutes: 90,
      description: 'Server updates',
      billable: true,
    })
    expect(res.status).toBe(201)
    const entry = (await t.snapshot()).timeEntries.find(
      (e) => e.id === res.json.data.id
    )
    expect(entry).toMatchObject({
      clientId: 'c-masar',
      countsToAllowance: true,
      workOn: today,
    })
  })

  it('bills extra retainer hours exactly once', async () => {
    t = createTestApp()
    for (const _ of [1, 2]) {
      await t.call('POST', '/time', {
        engagementId: 'e-masar',
        minutes: FULL_DAY,
        description: 'Migration',
        billable: true,
      })
    }
    const before = await t.snapshot()
    const e = before.engagements.find((x) => x.id === 'e-masar')!
    const expected = engagementMeter(before, e, today).unbilled
    expect(expected).toBeGreaterThan(0)

    const res = await t.call('POST', '/engagements/e-masar/bill-hours')
    expect(res.status).toBe(201)
    const after = await t.snapshot()
    const line = after.invoiceItems.find(
      (i) => i.invoiceId === res.json.data.id
    )
    expect(line).toMatchObject({
      sourceKind: 'retainer_overage',
      quantity: expected,
    })
    expect(engagementMeter(after, e, today).unbilled).toBe(0)

    const again = await t.call('POST', '/engagements/e-masar/bill-hours')
    expect(again.status).toBe(409)
  })

  it('refuses to bill hours on a project', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/engagements/e-nakhla/bill-hours')
    expect(res.status).toBe(409)
  })
})

describe('today', () => {
  it('adds, completes and carries over tasks', async () => {
    t = createTestApp()
    const added = await t.call('POST', '/tasks', { title: 'Call Noura' })
    const id = String(added.json.data.id)
    await t.call('POST', `/tasks/${id}/toggle`)
    let db = await t.snapshot()
    expect(db.tasks.find((task) => task.id === id)?.completedAt).toBeDefined()

    const open = db.tasks.filter(
      (task) =>
        !task.completedAt && task.dueOn !== undefined && task.dueOn <= today
    )
    const carried = await t.call('POST', '/tasks/carry-over')
    expect(carried.json.data.moved).toBe(open.length)
    db = await t.snapshot()
    for (const task of open) {
      expect(db.tasks.find((x) => x.id === task.id)?.dueOn).toBe(
        addDaysIso(today, 1)
      )
    }
  })

  it('closes the day: reflection saved and tasks carried in one step', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/day/close', { note: 'good day' })
    expect(res.status).toBe(200)
    const db = await t.snapshot()
    expect(db.reflections).toContainEqual(
      expect.objectContaining({ day: today, note: 'good day' })
    )
    const leftToday = db.tasks.filter(
      (task) =>
        !task.completedAt && task.dueOn !== undefined && task.dueOn <= today
    )
    expect(leftToday.filter((task) => task.assigneeId === 'm-owner')).toEqual(
      []
    )
  })

  it('keeps one reflection per day', async () => {
    t = createTestApp()
    await t.call('PUT', '/reflections/today', { note: 'first' })
    await t.call('PUT', '/reflections/today', { note: 'second' })
    const mine = (await t.snapshot()).reflections.filter((r) => r.day === today)
    expect(mine).toEqual([expect.objectContaining({ note: 'second' })])
  })
})

describe('leads', () => {
  it('moves a lead and records the contact', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/leads/l1/stage', { stage: 'proposal' })
    expect(res.status).toBe(200)
    const lead = (await t.snapshot()).leads.find((l) => l.id === 'l1')
    expect(lead).toMatchObject({ stage: 'proposal', lastContactOn: today })
  })
})

describe('lead conversion (won ⇒ client + engagement)', () => {
  const body = {
    title: 'Booking app',
    type: 'project',
    amountMinor: 400000,
    startOn: today,
  }

  it('refuses to mark a lead won without converting it', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/leads/l1/stage', { stage: 'won' })
    expect(res.status).toBe(409)
    expect(res.json.error?.code).toBe('lead_needs_conversion')
  })

  it('creates the client and the engagement, then links the lead', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/leads/l1/convert', body)
    expect(res.status).toBe(201)
    const { clientId, engagementId } = res.json.data
    const db = await t.snapshot()
    expect(db.leads.find((l) => l.id === 'l1')).toMatchObject({
      stage: 'won',
      clientId,
      engagementId,
    })
    expect(db.clients.find((c) => c.id === clientId)?.name).toBe(
      'نورة القحطاني'
    )
    expect(db.engagements.find((e) => e.id === engagementId)).toMatchObject({
      type: 'project',
      leadId: 'l1',
      amount: 400000,
    })

    const again = await t.call('POST', '/leads/l1/convert', body)
    expect(again.json.error?.code).toBe('lead_already_won')
  })

  it('opens a subscription with its first cycle and grace days', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/leads/l2/convert', {
      ...body,
      type: 'subscription',
      cyclePeriod: 'monthly',
    })
    expect(res.status).toBe(201)
    const db = await t.snapshot()
    const e = db.engagements.find((x) => x.id === res.json.data.engagementId)
    expect(e?.graceDays).toBe(5)
    expect(db.cycles.filter((c) => c.engagementId === e?.id)).toHaveLength(1)
  })

  it('validates the shape before touching the database', async () => {
    t = createTestApp()
    const res = await t.call('POST', '/leads/l1/convert', {
      ...body,
      type: 'retainer',
      cyclePeriod: 'monthly',
    })
    expect(res.status).toBe(400)
    expect((await t.snapshot()).leads.find((l) => l.id === 'l1')?.stage).toBe(
      'lead'
    )
  })

  it('rejects an unconverted won lead at the database level', async () => {
    t = createTestApp()
    expect(() =>
      t.db
        .update(leads)
        .set({ stage: 'won', closedAt: new Date().toISOString() })
        .where(eq(leads.id, 'l1'))
        .run()
    ).toThrow(/CHECK constraint failed/)
  })
})
