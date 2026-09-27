import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { MissingFields } from '@/shared/components/missing-fields'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { isArchived } from '@/shared/model/archive'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Money } from '@/features/rates/ui/money'
import { useCreateInvoice } from '../api/use-invoice-actions'
import { createInvoiceInput } from '../model/invoice.input'
import { InvoiceLinesEditor } from './invoice-lines-editor'
import { emptyLine, type LineDraft } from './line-draft'

/** "No engagement" in the select (Radix needs a non-empty value). */
const NONE = 'none'

type Props = { clientId?: string; onClose: () => void }

/** Issues a manual invoice for a client, optionally tied to an engagement. */
export function NewInvoiceDialog({ clientId: initialClient, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const db = useDb()
  const create = useCreateInvoice()
  const [clientId, setClientId] = useState(initialClient ?? '')
  const [engagementId, setEngagementId] = useState(NONE)
  const [lines, setLines] = useState<LineDraft[]>(() => [emptyLine()])
  const [dueOn, setDueOn] = useState('')
  const [note, setNote] = useState('')
  const client = db.clients.find((c) => c.id === clientId)
  const engagements = db.engagements.filter(
    (e) => e.clientId === clientId && !isArchived(e)
  )
  const items = lines.map((l) => ({
    description: l.description,
    quantity: Number(l.quantity),
    unitPriceMinor: toMinor(Number(l.price)),
  }))
  const total = items.reduce(
    (sum, i) => sum + Math.round(i.quantity * i.unitPriceMinor),
    0
  )
  const body = {
    clientId,
    engagementId: engagementId === NONE ? undefined : engagementId,
    items,
    dueOn: dueOn || undefined,
    note,
  }
  const isValid = createInvoiceInput.safeParse(body).success

  const pickClient = (id: string) => {
    setClientId(id)
    setEngagementId(NONE)
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || create.isPending) return
    create.mutate(body, {
      onSuccess: ({ id, number }) => {
        toast.success(t('invoice.form.issued', { number }))
        onClose()
        navigate({ to: '/invoices/$id', params: { id } })
      },
    })
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-2xl'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>{t('invoice.form.title')}</DialogTitle>
            <DialogDescription>{t('invoice.form.hint')}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-3 sm:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='invoice-client'>{t('common.client')}</Label>
              <Select value={clientId} onValueChange={pickClient}>
                <SelectTrigger id='invoice-client' className='w-full'>
                  <SelectValue placeholder={t('engagements.form.pickClient')} />
                </SelectTrigger>
                <SelectContent>
                  {db.clients
                    .filter((c) => !isArchived(c))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.company ?? c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='invoice-engagement'>
                {t('invoice.form.engagement')}
              </Label>
              <Select
                value={engagementId}
                onValueChange={setEngagementId}
                disabled={engagements.length === 0}
              >
                <SelectTrigger id='invoice-engagement' className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>
                    {t('invoice.form.noEngagement')}
                  </SelectItem>
                  {engagements.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <InvoiceLinesEditor
            lines={lines}
            currency={client?.currency ?? '—'}
            onChange={setLines}
          />
          <div className='grid gap-3 sm:grid-cols-2'>
            <TextField
              id='invoice-due'
              label={t('invoice.dueDate')}
              type='date'
              dir='ltr'
              value={dueOn}
              onChange={setDueOn}
              hint={t('invoice.form.dueHint')}
            />
            <div className='grid content-start gap-1 sm:text-end'>
              <span className='text-sm text-muted-foreground'>
                {t('invoice.total')}
              </span>
              {client ? (
                <Money
                  amount={total}
                  currency={client.currency}
                  className='text-xl font-semibold'
                />
              ) : (
                <span className='text-xl font-semibold'>—</span>
              )}
            </div>
          </div>
          <TextField
            id='invoice-note'
            label={t('invoice.form.note')}
            value={note}
            onChange={setNote}
            isMultiline
          />
          <MissingFields
            fields={[
              !clientId && t('common.client'),
              total <= 0 && t('invoice.form.lines'),
            ]}
          />
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <PendingButton
              type='submit'
              disabled={!isValid}
              isPending={create.isPending}
            >
              {t('invoice.form.submit')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
