import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { rateLimit } from './rate-limit'

function appWith(clock: { at: number }) {
  return new Hono()
    .use('*', rateLimit({ max: 2, windowMs: 1000, now: () => clock.at }))
    .get('/', (c) => c.text('ok'))
}

const hit = async (app: Hono, headers: Record<string, string> = {}) =>
  (await app.request('/', { headers })).status

describe('rateLimit', () => {
  it('blocks after the limit and allows again in the next window', async () => {
    const clock = { at: 0 }
    const app = appWith(clock)
    expect([await hit(app), await hit(app), await hit(app)]).toEqual([
      200, 200, 429,
    ])
    clock.at = 1000
    expect(await hit(app)).toBe(200)
  })

  it('ignores a spoofed X-Forwarded-For', async () => {
    const app = appWith({ at: 0 })
    const statuses = []
    for (let i = 0; i < 4; i++) {
      statuses.push(await hit(app, { 'x-forwarded-for': `10.0.0.${i}` }))
    }
    expect(statuses).toContain(429)
  })

  it('keeps Cloudflare visitors apart', async () => {
    const app = appWith({ at: 0 })
    await hit(app, { 'cf-connecting-ip': '1.1.1.1' })
    await hit(app, { 'cf-connecting-ip': '1.1.1.1' })
    expect(await hit(app, { 'cf-connecting-ip': '1.1.1.1' })).toBe(429)
    expect(await hit(app, { 'cf-connecting-ip': '2.2.2.2' })).toBe(200)
  })
})
