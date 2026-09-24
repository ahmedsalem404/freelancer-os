import { pill } from '@/shared/components/pill'
import type { InvoiceStatus } from '@/features/invoices/model/invoice-status'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

const INVOICE_STYLE: Record<InvoiceStatus, string> = {
  unpaid: 'bg-muted text-muted-foreground',
  partial: 'bg-billable-soft text-billable-foreground dark:text-billable',
  paid: 'bg-success-soft text-success',
  overdue: 'bg-overdue-soft text-overdue',
  draft: 'bg-muted text-muted-foreground ring-1 ring-dashed ring-border',
  void: 'bg-muted text-muted-foreground line-through',
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation()
  return (
    <span className={cn(pill, INVOICE_STYLE[status])}>
      {t(`invoiceStatus.${status}`)}
    </span>
  )
}
