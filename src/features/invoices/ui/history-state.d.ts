import '@tanstack/history'

declare module '@tanstack/history' {
  interface HistoryState {
    /** Set when an invoice was just issued from an engagement. */
    attachPdf?: boolean
  }
}
