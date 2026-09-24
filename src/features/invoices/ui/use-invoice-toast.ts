import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type InvoiceRef = { id: string; number: string }

/** "Invoice INV-… created" with a button that opens it. */
export function useInvoiceToast() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (invoice: InvoiceRef, key = 'guard.invoiceCreated') =>
    toast.success(t(key, { number: invoice.number }), {
      action: {
        label: t('common.open'),
        onClick: () =>
          navigate({ to: '/invoices/$id', params: { id: invoice.id } }),
      },
    })
}
