import { useState } from 'react'
import { TextField } from '@/shared/components/text-field'
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
import { useVoidInvoice } from '../api/use-invoice-actions'
import type { Invoice } from '../model/invoice.schema'

type Props = { invoice: Invoice; onClose: () => void }

/** Voids an issued, unpaid invoice; the reason stays on record. */
export function VoidInvoiceDialog({ invoice, onClose }: Props) {
  const { t } = useTranslation()
  const cancel = useVoidInvoice()
  const [reason, setReason] = useState('')
  const isValid = reason.trim().length > 0

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || cancel.isPending) return
    cancel.mutate(
      { id: invoice.id, reason: reason.trim() },
      {
        onSuccess: () => {
          toast.success(t('invoice.void.done', { number: invoice.number }))
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {t('invoice.void.title', { number: invoice.number })}
            </DialogTitle>
            <DialogDescription>{t('invoice.void.hint')}</DialogDescription>
          </DialogHeader>
          <TextField
            id='void-reason'
            label={t('invoice.void.reason')}
            value={reason}
            onChange={setReason}
            autoFocus
          />
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type='submit'
              variant='destructive'
              disabled={!isValid || cancel.isPending}
            >
              {t('invoice.void.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
