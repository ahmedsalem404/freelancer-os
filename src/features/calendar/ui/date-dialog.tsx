import { useState } from 'react'
import { ChoiceRow } from '@/shared/components/choice-row'
import { PendingButton } from '@/shared/components/pending-button'
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
import { useSaveImportantDate } from '../api/use-calendar'
import type { ImportantDate } from '../model/calendar.schema'
import { DATE_KINDS, DATE_RECURRENCES } from '../model/enums'

const DEFAULT_REMIND_DAYS = '14'

type Props = {
  /** The date to edit; omitted to add one on `day`. */
  date?: ImportantDate
  day: string
  onClose: () => void
}

/** A domain, SSL certificate, license… with a reminder before it lapses. */
export function DateDialog({ date, day, onClose }: Props) {
  const { t } = useTranslation()
  const save = useSaveImportantDate()
  const [title, setTitle] = useState(date?.title ?? '')
  const [kind, setKind] = useState(date?.kind ?? 'domain')
  const [dueOn, setDueOn] = useState(date?.dueOn ?? day)
  const [recurrence, setRecurrence] = useState(date?.recurrence ?? 'yearly')
  const [remindDays, setRemindDays] = useState(
    date ? String(date.remindDaysBefore) : DEFAULT_REMIND_DAYS
  )
  const days = Number(remindDays)
  const daysError =
    remindDays.trim() === '' || (Number.isInteger(days) && days >= 0)
      ? undefined
      : t('common.mustBePositive')
  const isValid =
    title.trim() !== '' && dueOn !== '' && remindDays !== '' && !daysError

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || save.isPending) return
    save.mutate(
      {
        id: date?.id,
        title,
        kind,
        dueOn,
        recurrence,
        remindDaysBefore: days,
        clientId: date?.clientId,
        notes: date?.notes,
      },
      {
        onSuccess: () => {
          toast.success(t('calendar.dateSaved'))
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {t(date ? 'calendar.editDate' : 'calendar.addDate')}
            </DialogTitle>
            <DialogDescription>{t('calendar.dateHint')}</DialogDescription>
          </DialogHeader>
          <TextField
            id='date-title'
            label={t('calendar.eventTitle')}
            placeholder='example.com'
            value={title}
            onChange={setTitle}
          />
          <ChoiceRow
            label={t('calendar.dateKind')}
            options={DATE_KINDS}
            value={kind}
            onChange={setKind}
            labelOf={(k) =>
              k === 'other' ? t('calendar.otherKind') : t(`calendar.kinds.${k}`)
            }
          />
          <div className='grid grid-cols-2 gap-3'>
            <TextField
              id='date-due'
              label={t('calendar.dueOn')}
              type='date'
              dir='ltr'
              value={dueOn}
              onChange={setDueOn}
            />
            <TextField
              id='date-remind'
              label={t('calendar.remindDays')}
              inputMode='numeric'
              dir='ltr'
              value={remindDays}
              onChange={setRemindDays}
              error={daysError}
            />
          </div>
          <ChoiceRow
            label={t('calendar.recurrence')}
            options={DATE_RECURRENCES}
            value={recurrence}
            onChange={setRecurrence}
            labelOf={(r) => t(`calendar.recurrences.${r}`)}
          />
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <PendingButton
              type='submit'
              disabled={!isValid}
              isPending={save.isPending}
            >
              {t('common.save')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
