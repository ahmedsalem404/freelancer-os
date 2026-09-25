import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins classes and lets the later Tailwind class win', () => {
    expect(cn('p-2 text-sm', undefined, 'p-4')).toBe('text-sm p-4')
  })
})
