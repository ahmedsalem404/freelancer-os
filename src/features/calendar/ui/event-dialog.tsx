import { useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { isArchived } from '@/shared/model/archive'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDeleteEvent, useSaveEvent } from '../api/use-calendar'
import type { CalendarEvent } from '../model/calendar.schema'

const NO_CLIENT = 'none'

type Props = {
  /** The event to edit; omitted to add one on `day`. */
  event?: CalendarEvent
  day: string
  onClose: () => void
}

/** Add or edit a meeting, call or any manual event. */
export function EventDialog({ event, day, onClose }: Props) {
  const { t } = useTranslation()
  const clients = useDb().clients.filter((c) => !isArchived(c))
  const save = useSaveEvent()
  const remove = useDeleteEvent()
  const [title, setTitle] = useState(event?.title ?? '')
  const [startsOn, setStartsOn] = useState(event?.startsOn ?? day)
  const [endsOn, setEndsOn] = useState(event?.endsOn ?? '')
  const [startTime, setStartTime] = useState(event?.startTime ?? '')
  const [clientId, setClientId] = useState(event?.clientId ?? NO_CLIENT)
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [isDeleting, setIsDeleting] = useState(false)
  const endError =
    endsOn && endsOn < startsOn ? t('calendar.endBeforeStart') : undefined
  const isValid = title.trim() !== '' && startsOn !== '' && !endError

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid || save.isPending) return
    save.mutate(
      {
        id: event?.id,
        title,
        startsOn,
        endsOn,
        startTime,
        clientId: clientId === NO_CLIENT ? undefined : clientId,
        notes,
      },
      {
        onSuccess: () => {
          toast.success(t('calendar.eventSaved'))
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
              {t(event ? 'calendar.editEvent' : 'calendar.addEvent')}
            </DialogTitle>
          </DialogHeader>
          <TextField
            id='event-title'
            label={t('calendar.eventTitle')}
            value={title}
            onChange={setTitle}
          />
          <div className='grid grid-cols-2 gap-3'>
            <TextField
              id='event-start'
              label={t('calendar.startsOn')}
              type='date'
              dir='ltr'
              value={startsOn}
              onChange={setStartsOn}
            />
            <TextField
              id='event-time'
              label={t('calendar.time')}
              type='time'
              dir='ltr'
              value={startTime}
              onChange={setStartTime}
            />
          </div>
          <TextField
            id='event-end'
            label={t('calendar.endsOn')}
            type='date'
            dir='ltr'
            value={endsOn}
            onChange={setEndsOn}
            error={endError}
          />
          <div className='grid gap-2'>
            <Label htmlFor='event-client'>{t('common.client')}</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id='event-client' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CLIENT}>
                  {t('calendar.noClient')}
                </SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company ?? c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <TextField
            id='event-notes'
            label={t('files.note')}
            isMultiline
            value={notes}
            onChange={setNotes}
          />
          <DialogFooter className='sm:justify-between'>
            {event ? (
              <Button
                type='button'
                variant='ghost'
                className='text-destructive'
                onClick={() => setIsDeleting(true)}
              >
                {t('common.delete')}
              </Button>
            ) : (
              <span />
            )}
            <div className='flex flex-col-reverse gap-2 sm:flex-row'>
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
            </div>
          </DialogFooter>
        </form>
        {event && (
          <ConfirmDialog
            open={isDeleting}
            onOpenChange={setIsDeleting}
            destructive
            title={t('common.deleteTitle', { name: event.title })}
            desc={t('calendar.deleteEventHint')}
            confirmText={t('common.delete')}
            isLoading={remove.isPending}
            handleConfirm={() =>
              remove.mutate(event.id, {
                onSuccess: () => {
                  toast.success(t('common.deletedDone'))
                  onClose()
                },
              })
            }
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
