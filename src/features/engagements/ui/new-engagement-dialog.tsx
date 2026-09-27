import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { ChoiceRow } from '@/shared/components/choice-row'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { isArchived } from '@/shared/model/archive'
import { todayIso } from '@/shared/model/dates'
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
import { useOpenEngagement } from '../api/use-save-engagement'
import { ENGAGEMENT_TYPES, type EngagementType } from '../model/enums'
import { openEngagementInput } from '../model/terms.input'

const PERIODS = ['monthly', 'yearly'] as const
const DEFAULT_HOURS = '10'

type Props = {
  /** Preselects the client (e.g. opened from the client page). */
  clientId?: string
  onClose: () => void
}

/** Opens an engagement for an existing client. */
export function NewEngagementDialog({
  clientId: initialClient,
  onClose,
}: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { clients } = useDb()
  const open = useOpenEngagement()
  const [clientId, setClientId] = useState(initialClient ?? '')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EngagementType>('project')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('monthly')
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const [startOn, setStartOn] = useState(todayIso())
  const client = clients.find((c) => c.id === clientId)
  const body = {
    clientId,
    title,
    type,
    amountMinor: toMinor(Number(amount)),
    startOn,
    cyclePeriod: type === 'project' ? undefined : period,
    includedHours: type === 'retainer' ? Number(hours) : undefined,
  }
  const isValid =
    amount.trim() !== '' && openEngagementInput.safeParse(body).success

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || open.isPending) return
    open.mutate(body, {
      onSuccess: ({ id }) => {
        toast.success(t('engagements.form.opened'))
        onClose()
        navigate({ to: '/engagements/$id', params: { id } })
      },
    })
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>{t('engagements.add')}</DialogTitle>
            <DialogDescription>{t('engagements.form.hint')}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-2'>
            <Label htmlFor='engagement-client'>{t('common.client')}</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id='engagement-client' className='w-full'>
                <SelectValue placeholder={t('engagements.form.pickClient')} />
              </SelectTrigger>
              <SelectContent>
                {clients
                  .filter((c) => !isArchived(c))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company ?? c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <TextField
            id='engagement-title'
            label={t('engagements.form.title')}
            value={title}
            onChange={setTitle}
          />
          <ChoiceRow
            label={t('engagements.form.type')}
            options={ENGAGEMENT_TYPES}
            value={type}
            onChange={setType}
            labelOf={(v) => t(`types.${v}`)}
          />
          {type !== 'project' && (
            <ChoiceRow
              label={t('engagements.form.period')}
              options={PERIODS}
              value={period}
              onChange={setPeriod}
              labelOf={(v) => t(`engagements.form.${v}`)}
            />
          )}
          <div className='grid grid-cols-2 gap-3'>
            <TextField
              id='engagement-amount'
              label={`${t('engagements.form.amount')} (${client?.currency ?? '—'})`}
              dir='ltr'
              inputMode='decimal'
              className='num'
              value={amount}
              onChange={setAmount}
            />
            <TextField
              id='engagement-start'
              label={t('engagements.form.startOn')}
              type='date'
              dir='ltr'
              value={startOn}
              onChange={setStartOn}
            />
          </div>
          {type === 'retainer' && (
            <TextField
              id='engagement-hours'
              label={t('engagements.form.hours')}
              dir='ltr'
              inputMode='decimal'
              className='num'
              value={hours}
              onChange={setHours}
            />
          )}
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <PendingButton
              type='submit'
              disabled={!isValid}
              isPending={open.isPending}
            >
              {t('engagements.form.submit')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
