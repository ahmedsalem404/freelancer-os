import { useState } from 'react'
import { ChoiceRow } from '@/shared/components/choice-row'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { useFieldErrors } from '@/shared/lib/use-field-errors'
import { CURRENCIES, type Currency } from '@/shared/money/currency'
import { toMajor, toMinor } from '@/shared/money/money'
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
import { useDeleteLead, useSaveLead } from '../api/use-save-lead'
import { leadInput } from '../model/lead.input'
import type { Lead } from '../model/lead.schema'

type Props = {
  /** Present when editing an existing lead. */
  lead?: Lead
  onClose: () => void
}

/** Adds a potential client to the board, or edits / removes one. */
export function LeadFormDialog({ lead, onClose }: Props) {
  const { t } = useTranslation()
  const { positive } = useFieldErrors()
  const save = useSaveLead()
  const remove = useDeleteLead()
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [form, setForm] = useState({
    name: lead?.name ?? '',
    company: lead?.company ?? '',
    whatsapp: lead?.whatsapp ?? '',
    service: lead?.service ?? '',
    amount: lead ? String(toMajor(lead.amount)) : '',
    currency: (lead?.currency ?? 'SAR') as Currency,
    source: lead?.source ?? '',
    nextFollowUpOn: lead?.nextFollowUpOn ?? '',
    notes: lead?.notes ?? '',
  })
  const set =
    <K extends keyof typeof form>(key: K) =>
    (value: (typeof form)[K]) =>
      setForm((prev) => ({ ...prev, [key]: value }))
  const parsed = leadInput.safeParse({
    ...form,
    amountMinor: toMinor(Number(form.amount || 0)),
    nextFollowUpOn: form.nextFollowUpOn || undefined,
  })

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!parsed.success || save.isPending) return
    save.mutate(
      { leadId: lead?.id, ...parsed.data },
      {
        onSuccess: () => {
          toast.success(t(lead ? 'leads.form.saved' : 'leads.form.added'))
          onClose()
        },
      }
    )
  }

  return (
    <>
      <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
        <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
          <form onSubmit={submit} className='grid gap-4'>
            <DialogHeader className='text-start'>
              <DialogTitle>
                {t(lead ? 'leads.form.editTitle' : 'leads.form.addTitle')}
              </DialogTitle>
              <DialogDescription>{t('leads.form.hint')}</DialogDescription>
            </DialogHeader>
            <TextField
              id='lead-name'
              label={t('leads.form.name')}
              value={form.name}
              onChange={set('name')}
              autoFocus
            />
            <TextField
              id='lead-company'
              label={t('leads.form.company')}
              value={form.company}
              onChange={set('company')}
            />
            <TextField
              id='lead-whatsapp'
              label='WhatsApp'
              dir='ltr'
              inputMode='numeric'
              className='num'
              placeholder='967771234567'
              value={form.whatsapp}
              onChange={set('whatsapp')}
            />
            <TextField
              id='lead-service'
              label={t('leads.form.service')}
              value={form.service}
              onChange={set('service')}
            />
            <ChoiceRow
              label={t('leads.form.currency')}
              options={CURRENCIES}
              value={form.currency}
              onChange={set('currency')}
              labelOf={(c) => c}
            />
            <div className='grid grid-cols-2 gap-3'>
              <TextField
                id='lead-amount'
                label={`${t('leads.estimate')} (${form.currency})`}
                dir='ltr'
                inputMode='decimal'
                className='num'
                value={form.amount}
                onChange={set('amount')}
                error={form.amount ? positive(form.amount) : undefined}
              />
              <TextField
                id='lead-follow-up'
                label={t('leads.form.followUp')}
                type='date'
                dir='ltr'
                value={form.nextFollowUpOn}
                onChange={set('nextFollowUpOn')}
              />
            </div>
            <TextField
              id='lead-source'
              label={t('leads.source')}
              value={form.source}
              onChange={set('source')}
              placeholder={t('leads.form.sourcePlaceholder')}
            />
            <TextField
              id='lead-notes'
              label={t('leads.form.notes')}
              value={form.notes}
              onChange={set('notes')}
              isMultiline
            />
            <DialogFooter className='gap-2 sm:justify-between'>
              {lead ? (
                <Button
                  type='button'
                  variant='ghost'
                  className='text-destructive'
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  {t('common.delete')}
                </Button>
              ) : (
                <span />
              )}
              <div className='flex gap-2'>
                <Button type='button' variant='ghost' onClick={onClose}>
                  {t('common.cancel')}
                </Button>
                <PendingButton
                  type='submit'
                  disabled={!parsed.success}
                  isPending={save.isPending}
                >
                  {t('common.save')}
                </PendingButton>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {lead && (
        <ConfirmDialog
          open={isConfirmingDelete}
          onOpenChange={setIsConfirmingDelete}
          destructive
          title={t('common.deleteTitle', { name: lead.company ?? lead.name })}
          desc={t('leads.form.deleteHint')}
          confirmText={t('common.delete')}
          isLoading={remove.isPending}
          handleConfirm={() =>
            remove.mutate(lead.id, {
              onSuccess: () => {
                toast.success(t('common.deletedDone'))
                onClose()
              },
            })
          }
        />
      )}
    </>
  )
}
