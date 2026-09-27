import { afterEach, describe, expect, it } from 'vitest'
import { ASSISTANT_ID, createTestApp } from './test-app'

let t: ReturnType<typeof createTestApp>
afterEach(() => t.close())

describe('message templates', () => {
  it('saves an edited template and resets it to the built-in text', async () => {
    t = createTestApp()
    const saved = await t.call('PUT', '/templates/reminder_due', {
      locale: 'ar',
      body: 'reminder {{invoice_number}}',
    })
    expect(saved.status).toBe(200)
    // Saving again replaces, never duplicates.
    await t.call('PUT', '/templates/reminder_due', { locale: 'ar', body: 'v2' })
    expect((await t.snapshot()).templates).toEqual([
      { key: 'reminder_due', locale: 'ar', body: 'v2' },
    ])

    const reset = await t.call('DELETE', '/templates/reminder_due/ar')
    expect(reset.status).toBe(200)
    expect((await t.snapshot()).templates).toEqual([])
  })

  it('refuses an unknown template and assistants', async () => {
    t = createTestApp()
    const bad = await t.call('PUT', '/templates/nope', {
      locale: 'ar',
      body: 'x',
    })
    expect(bad.status).toBe(404)
    const token = t.sessionFor(ASSISTANT_ID)
    const res = await t.callAs(token, 'PUT', '/templates/reminder_due', {
      locale: 'ar',
      body: 'x',
    })
    expect(res.status).toBe(403)
  })
})

describe('reminders log', () => {
  it('logs a decision once, even when sent twice', async () => {
    t = createTestApp()
    const body = {
      kind: 'invoice_due',
      targetId: 'inv-1',
      occurrenceOn: '2026-09-01',
      offsetDays: 7,
      action: 'sent',
      messageBody: 'hello',
    }
    expect((await t.call('POST', '/reminders', body)).status).toBe(201)
    const again = await t.call('POST', '/reminders', {
      ...body,
      action: 'dismissed',
    })
    expect(again.status).toBe(201)
    const log = (await t.snapshot()).reminderLog
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ targetId: 'inv-1', action: 'sent' })
  })
})

describe('calendar', () => {
  it('adds, edits and deletes a manual event', async () => {
    t = createTestApp()
    const added = await t.call('POST', '/calendar-events', {
      title: 'Call',
      startsOn: '2026-10-02',
      startTime: '09:30',
      clientId: 'c-nakhla',
    })
    expect(added.status).toBe(201)
    const id = String(added.json.data.id)
    await t.call('PUT', `/calendar-events/${id}`, {
      title: 'Call (moved)',
      startsOn: '2026-10-03',
      startTime: '',
    })
    const event = (await t.snapshot()).calendarEvents.find((e) => e.id === id)
    expect(event).toMatchObject({
      title: 'Call (moved)',
      startsOn: '2026-10-03',
    })
    expect(event?.startTime).toBeUndefined()
    expect((await t.call('DELETE', `/calendar-events/${id}`)).status).toBe(200)
    expect((await t.call('DELETE', `/calendar-events/${id}`)).status).toBe(404)
  })

  it('refuses an end before the start, and an unknown client', async () => {
    t = createTestApp()
    const backwards = await t.call('POST', '/calendar-events', {
      title: 'x',
      startsOn: '2026-10-05',
      endsOn: '2026-10-01',
    })
    expect(backwards.status).toBe(400)
    const ghost = await t.call('POST', '/calendar-events', {
      title: 'x',
      startsOn: '2026-10-05',
      clientId: 'nobody',
    })
    expect(ghost.status).toBe(404)
  })

  it('rolls a yearly date forward when handled, and closes a one-off', async () => {
    t = createTestApp()
    const yearly = await t.call('POST', '/important-dates', {
      title: 'Domain',
      kind: 'domain',
      dueOn: '2026-10-10',
      recurrence: 'yearly',
      remindDaysBefore: 14,
    })
    const yearlyId = String(yearly.json.data.id)
    await t.call('POST', `/important-dates/${yearlyId}/handled`)
    const once = await t.call('POST', '/important-dates', {
      title: 'License',
      kind: 'license',
      dueOn: '2026-10-10',
      recurrence: 'none',
      remindDaysBefore: 7,
    })
    const onceId = String(once.json.data.id)
    await t.call('POST', `/important-dates/${onceId}/handled`)

    const dates = (await t.snapshot()).importantDates
    expect(dates.find((d) => d.id === yearlyId)?.dueOn).toBe('2027-10-10')
    expect(dates.find((d) => d.id === onceId)?.handledOn).toBeTruthy()

    await t.call('POST', `/important-dates/${onceId}/archive`)
    const after = (await t.snapshot()).importantDates
    expect(after.some((d) => d.id === onceId)).toBe(false)
  })
})
