import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useUploadFile } from '@/features/files'
import type { Invoice } from '../model/invoice.schema'
import { renderInvoicePdf } from './invoice-pdf'

/**
 * Saves the invoice on screen as a PDF in its engagement's files. The PDF is
 * made in the browser from the printed document, then uploaded like any file.
 */
export function useSaveInvoicePdf() {
  const { t } = useTranslation()
  const upload = useUploadFile()
  const [isRendering, setIsRendering] = useState(false)

  const save = async (invoice: Invoice) => {
    const element = document.querySelector<HTMLElement>('.print-area')
    if (!element || !invoice.engagementId) return
    setIsRendering(true)
    try {
      const blob = await renderInvoicePdf(element)
      await upload.mutateAsync({
        fields: {
          kind: 'invoice',
          engagementId: invoice.engagementId,
          invoiceId: invoice.id,
        },
        file: new File([blob], `${invoice.number}.pdf`, {
          type: 'application/pdf',
        }),
      })
      toast.success(t('invoice.pdf.saved'))
    } catch {
      toast.error(t('invoice.pdf.failed'))
    } finally {
      setIsRendering(false)
    }
  }

  return { save, isPending: isRendering || upload.isPending }
}
