import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import type { Invoice } from '@/features/invoices/model/invoice.schema'
import type { useSaveInvoicePdf } from './use-save-invoice-pdf'

/**
 * Just issued from an engagement: keep a PDF copy with its files, once, then
 * clear the navigation flag so a reload does not save it again.
 */
export function useAttachPdfOnIssue(
  invoice: Invoice,
  canSavePdf: boolean,
  pdf: ReturnType<typeof useSaveInvoicePdf>
) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const wantsPdf = state.attachPdf === true
  const hasTried = useRef(false)
  useEffect(() => {
    if (!wantsPdf || !canSavePdf || hasTried.current) return
    hasTried.current = true
    void pdf.save(invoice).then(() =>
      navigate({
        to: '/invoices/$id',
        params: { id: invoice.id },
        replace: true,
        state: {},
      })
    )
  }, [wantsPdf, canSavePdf, pdf, invoice, navigate])
}
