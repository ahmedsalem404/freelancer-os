import { describe, expect, it } from 'vitest'
import { safeRedirect } from './session-query'

describe('safeRedirect', () => {
  it('keeps a path on this site', () => {
    expect(safeRedirect('/invoices/inv-1?tab=pay#top')).toBe(
      '/invoices/inv-1?tab=pay#top'
    )
  })

  it('falls back to the home page for anything else', () => {
    for (const target of [
      undefined,
      '',
      'https://evil.example/phish',
      '//evil.example/phish',
      '/sign-in?redirect=/',
    ]) {
      expect(safeRedirect(target), String(target)).toBe('/')
    }
  })
})
