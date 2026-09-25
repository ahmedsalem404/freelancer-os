import { TextField } from '@/shared/components/text-field'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useUpdateEngagement } from '../api/use-save-engagement'
import type { Engagement } from '../model/engagement.schema'
import { updateEngagementInput } from '../model/terms.input'

type Props = { engagement: Engagement; onClose: () => void }

/** Renames an engagement and sets what happens next. */
export function EditEngagementDialog({ engagement, onClose }: Props) {
  const { t } = useTranslation()
  const update = useUpdateEngagement()
  const [title, setTitle] = useState(engagement.title)
  const [nextAction, setNextAction] = useState(engagement.nextAction)
  const [nextActionOn, setNextActionOn] = useState(
    engagement.nextActionOn ?? ''
  )
  const body = {
    title,
    nextAction,
    nextActionOn: nextActionOn || undefined,
  }
  const isValid = updateEngagementInput.safeParse(body).success

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || update.isPending) return
    update.mutate(
      { id: engagement.id, ...body },
      {
        onSuccess: () => {
          toast.success(t('engagements.form.saved'))
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
            <DialogTitle>{t('engagements.form.editTitle')}</DialogTitle>
          </DialogHeader>
          <TextField
            id='engagement-edit-title'
            label={t('engagements.form.title')}
            value={title}
            onChange={setTitle}
          />
          <TextField
            id='engagement-next'
            label={t('engagements.nextAction')}
            value={nextAction}
            onChange={setNextAction}
            placeholder={t('engagements.form.nextPlaceholder')}
          />
          <TextField
            id='engagement-next-on'
            label={t('engagements.form.nextOn')}
            type='date'
            dir='ltr'
            value={nextActionOn}
            onChange={setNextActionOn}
          />
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={!isValid || update.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
