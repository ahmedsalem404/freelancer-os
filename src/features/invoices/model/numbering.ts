/** The settings columns that drive invoice numbering. */
export type NumberingState = {
  invoicePrefix: string
  invoiceSeqYear: number
  invoiceSeqNext: number
  invoiceSeqPad: number
}

/**
 * Next invoice number `PREFIX-YYYY-NNN`; the sequence restarts at 1 every
 * year. Returns the number and the settings values to store after issuing.
 */
export function nextInvoiceNumber(state: NumberingState, year: number) {
  const seq = state.invoiceSeqYear === year ? state.invoiceSeqNext : 1
  const padded = String(seq).padStart(state.invoiceSeqPad, '0')
  return {
    number: `${state.invoicePrefix}-${year}-${padded}`,
    invoiceSeqYear: year,
    invoiceSeqNext: seq + 1,
  }
}
