import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { PendingButton } from '@/shared/components/pending-button'
import { addDaysIso, todayIso } from '@/shared/model/dates'
import { toMinor } from '@/shared/money/money'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useCreateInvoice } from '../api/use-invoice-actions'
import { createInvoiceInput } from '../model/invoice.input'
import {
  InvoiceFormFields,
  NO_ENGAGEMENT,
  type InvoiceDraft,
} from './invoice-form-fields'
import { InvoiceSheet } from './invoice-sheet'
import { emptyLine } from './line-draft'

type Props = {
  clientId?: string
  /** Preselects the engagement (opened from the engagement page). */
  engagementId?: string
  onClose: () => void
}

/**
 * Issues a manual invoice for a client, optionally tied to an engagement.
 * Two steps: edit, then preview exactly what the client will get.
 */
export function NewInvoiceDialog({
  clientId: initialClient,
  engagementId: initialEngagement,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const db = useDb()
  const create = useCreateInvoice()
  const [draft, setDraft] = useState<InvoiceDraft>(() => ({
    clientId: initialClient ?? '',
    engagementId: initialEngagement ?? NO_ENGAGEMENT,
    lines: [emptyLine()],
    dueOn: '',
    note: '',
  }))
  const [isPreviewing, setIsPreviewing] = useState(false)
  const client = db.clients.find((c) => c.id === draft.clientId)
  const engagement = db.engagements.find((e) => e.id === draft.engagementId)
  const identity = db.identities.find((i) => i.id === client?.billingIdentityId)
  // An engagement can be in another currency than its client.
  const currency = engagement?.currency ?? client?.currency
  const items = draft.lines.map((l) => ({
    description: l.description,
    quantity: Number(l.quantity),
    unitPriceMinor: toMinor(Number(l.price)),
  }))
  const total = items.reduce(
    (sum, i) => sum + Math.round(i.quantity * i.unitPriceMinor),
    0
  )
  const body = {
    clientId: draft.clientId,
    engagementId: engagement?.id,
    items,
    dueOn: draft.dueOn || undefined,
    note: draft.note,
  }
  const isValid = createInvoiceInput.safeParse(body).success
  const canPreview = isPreviewing && client && identity && currency

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || create.isPending) return
    if (!isPreviewing) {
      setIsPreviewing(true)
      return
    }
    create.mutate(body, {
      onSuccess: ({ id, number }) => {
        toast.success(t('invoice.form.issued', { number }))
        onClose()
        navigate({
          to: '/invoices/$id',
          params: { id },
          // The new page saves the PDF copy once it has drawn the document.
          state: { attachPdf: Boolean(engagement) },
        })
      },
    })
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={`max-h-[90dvh] overflow-y-auto ${canPreview ? 'sm:max-w-3xl' : 'sm:max-w-2xl'}`}
      >
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {t(
                canPreview ? 'invoice.form.previewTitle' : 'invoice.form.title'
              )}
            </DialogTitle>
            <DialogDescription>
              {t(canPreview ? 'invoice.form.previewHint' : 'invoice.form.hint')}
            </DialogDescription>
          </DialogHeader>
          {canPreview ? (
            <InvoiceSheet
              identity={identity}
              client={client}
              number='—'
              issueOn={todayIso()}
              dueOn={
                draft.dueOn ||
                addDaysIso(todayIso(), db.settings.defaultDueDays)
              }
              items={items.map((i, n) => ({
                id: String(n),
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPriceMinor,
                amount: Math.round(i.quantity * i.unitPriceMinor),
              }))}
              currency={currency}
              amount={total}
              methods={db.paymentMethods.filter(
                (m) => m.billingIdentityId === identity.id
              )}
              channel={engagement?.paymentChannel}
            />
          ) : (
            <InvoiceFormFields
              draft={draft}
              onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
              currency={currency}
              total={total}
            />
          )}
          <DialogFooter>
            {canPreview ? (
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsPreviewing(false)}
              >
                {t('invoice.form.backToEdit')}
              </Button>
            ) : (
              <Button type='button' variant='ghost' onClick={onClose}>
                {t('common.cancel')}
              </Button>
            )}
            <PendingButton
              type='submit'
              disabled={!isValid}
              isPending={create.isPending}
            >
              {t(canPreview ? 'invoice.form.submit' : 'invoice.form.preview')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
