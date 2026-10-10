import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { ChoiceRow } from '@/shared/components/choice-row'
import { MissingFields } from '@/shared/components/missing-fields'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { useFieldErrors } from '@/shared/lib/use-field-errors'
import { isArchived } from '@/shared/model/archive'
import { todayIso } from '@/shared/model/dates'
import { CURRENCIES, type Currency } from '@/shared/money/currency'
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
import {
  ENGAGEMENT_TYPES,
  type EngagementType,
  type PaymentChannel,
} from '../model/enums'
import { openEngagementInput } from '../model/terms.input'
import { PaymentChannelSelect } from './payment-channel-select'

const PERIODS = ['monthly', 'yearly'] as const

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
  const { positive } = useFieldErrors()
  const navigate = useNavigate()
  const { clients } = useDb()
  const open = useOpenEngagement()
  const [clientId, setClientId] = useState(initialClient ?? '')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EngagementType>('project')
  const [amount, setAmount] = useState('')
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('monthly')
  const [startOn, setStartOn] = useState(todayIso())
  const [pickedCurrency, setPickedCurrency] = useState<Currency>()
  const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>()
  const client = clients.find((c) => c.id === clientId)
  // Until one is picked, the client's currency applies.
  const currency = pickedCurrency ?? client?.currency
  const body = {
    clientId,
    title,
    type,
    amountMinor: toMinor(Number(amount)),
    startOn,
    currency,
    paymentChannel,
    cyclePeriod: type === 'project' ? undefined : period,
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
              label={`${t('engagements.form.amount')} (${currency ?? '—'})`}
              dir='ltr'
              inputMode='decimal'
              className='num'
              value={amount}
              onChange={setAmount}
              error={positive(amount)}
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
          <ChoiceRow
            label={t('engagements.form.currency')}
            options={CURRENCIES}
            value={currency ?? CURRENCIES[0]}
            onChange={setPickedCurrency}
            labelOf={(c) => c}
          />
          <PaymentChannelSelect
            id='engagement-channel'
            value={paymentChannel}
            onChange={setPaymentChannel}
          />
          <MissingFields
            fields={[
              !clientId && t('common.client'),
              !title.trim() && t('engagements.form.title'),
              !amount.trim() && t('engagements.form.amount'),
            ]}
          />
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
