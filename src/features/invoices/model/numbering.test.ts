import { describe, expect, it } from 'vitest'
import { nextInvoiceNumber } from './numbering'

const state = {
  invoicePrefix: 'INV',
  invoiceSeqYear: 2026,
  invoiceSeqNext: 15,
  invoiceSeqPad: 3,
}

describe('nextInvoiceNumber', () => {
  it('continues the sequence within the same year', () => {
    expect(nextInvoiceNumber(state, 2026)).toEqual({
      number: 'INV-2026-015',
      invoiceSeqYear: 2026,
      invoiceSeqNext: 16,
    })
  })

  it('restarts at 001 in a new year', () => {
    expect(nextInvoiceNumber(state, 2027)).toEqual({
      number: 'INV-2027-001',
      invoiceSeqYear: 2027,
      invoiceSeqNext: 2,
    })
  })

  it('never truncates numbers wider than the padding', () => {
    const big = { ...state, invoiceSeqNext: 1234 }
    expect(nextInvoiceNumber(big, 2026).number).toBe('INV-2026-1234')
  })
})
