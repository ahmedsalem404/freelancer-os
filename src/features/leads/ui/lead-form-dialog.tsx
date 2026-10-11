import { useState } from 'react'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { PendingButton } from '@/shared/components/pending-button'
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
import { useDeleteLead, useSaveLead } from '../api/use-save-lead'
import { leadInput } from '../model/lead.input'
import type { Lead } from '../model/lead.schema'
import { LeadFormFields } from './lead-form-fields'
import { initialLeadForm, type SetLeadField } from './lead-form-state'

type Props = {
  /** Present when editing an existing lead. */
  lead?: Lead
  onClose: () => void
}

/** Adds a potential client to the board, or edits / removes one. */
export function LeadFormDialog({ lead, onClose }: Props) {
  const { t } = useTranslation()
  const save = useSaveLead()
  const remove = useDeleteLead()
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [form, setForm] = useState(() => initialLeadForm(lead))
  const set: SetLeadField = (key) => (value) =>
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
            <LeadFormFields form={form} set={set} />
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
