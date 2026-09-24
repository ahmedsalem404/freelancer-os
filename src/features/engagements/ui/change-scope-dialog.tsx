import { toMinor } from '@/shared/money/money'
import type { Engagement } from '@/features/engagements/model/engagement.schema'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useInvoiceToast } from '@/features/invoices/ui/use-invoice-toast'
import { addDaysIso, todayIso } from '@/shared/model/dates'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useChangeScope } from '../api/use-engagement-actions'

const DEFAULT_FEE = '500'
const DEFAULT_DUE_IN_DAYS = 10

type Props = {
  engagement: Engagement
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Change scope: raise value + add deliverable + issue invoice, in one step. */
export function ChangeScopeDialog({ engagement, open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const changeScope = useChangeScope()
  const invoiceToast = useInvoiceToast()
  const [title, setTitle] = useState('')
  const [fee, setFee] = useState(DEFAULT_FEE)
  const [dueOn, setDueOn] = useState(() =>
    addDaysIso(todayIso(), DEFAULT_DUE_IN_DAYS)
  )
  const isValid =
    title.trim().length > 0 && Number(fee) > 0 && !changeScope.isPending

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid) return
    changeScope.mutate(
      {
        engagementId: engagement.id,
        title: title.trim(),
        feeMinor: toMinor(Number(fee)),
        dueOn,
      },
      {
        onSuccess: (invoice) => {
          invoiceToast(invoice)
          setTitle('')
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>{t('engagements.changeScope')}</DialogTitle>
            <DialogDescription>
              {t('engagements.changeScopeHint')}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-2'>
            <Label htmlFor='scope-title'>{t('engagements.scopeTitle')}</Label>
            <Input
              id='scope-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div className='grid gap-2'>
              <Label htmlFor='scope-fee'>
                {t('engagements.scopeFee')} ({engagement.currency})
              </Label>
              <Input
                id='scope-fee'
                dir='ltr'
                inputMode='decimal'
                className='num w-full'
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='scope-due'>{t('engagements.scopeDue')}</Label>
              <Input
                id='scope-due'
                type='date'
                dir='ltr'
                value={dueOn}
                onChange={(e) => setDueOn(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='ghost'
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={!isValid}>
              {t('guard.billScope')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
