import { useState } from 'react'
import { ChoiceRow } from '@/shared/components/choice-row'
import { TextField } from '@/shared/components/text-field'
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
import { useUpdateTerms } from '../api/use-save-engagement'
import type { Engagement } from '../model/engagement.schema'
import { updateTermsInput } from '../model/terms.input'

const PERIODS = ['monthly', 'yearly'] as const
type Period = (typeof PERIODS)[number]

type Props = { engagement: Engagement; onClose: () => void }

const initialPeriod = (e: Engagement): Period =>
  e.cyclePeriod === 'yearly' ? 'yearly' : 'monthly'

/** Changes the agreed amount, billing period and included hours. */
export function EditTermsDialog({ engagement: e, onClose }: Props) {
  const { t } = useTranslation()
  const update = useUpdateTerms()
  const [amount, setAmount] = useState(String(toMajor(e.amount)))
  const [period, setPeriod] = useState<Period>(initialPeriod(e))
  const [hours, setHours] = useState(String(e.allowanceIncluded))
  const body = {
    type: e.type,
    amountMinor: toMinor(Number(amount)),
    cyclePeriod: e.type === 'project' ? undefined : period,
    includedHours: e.type === 'retainer' ? Number(hours) : undefined,
  }
  const isValid =
    amount.trim() !== '' && updateTermsInput.safeParse(body).success

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || update.isPending) return
    update.mutate(
      { id: e.id, ...body },
      {
        onSuccess: ({ appliesToOpenCycle }) => {
          const isNextCycle = e.type !== 'project' && !appliesToOpenCycle
          toast.success(
            t(
              isNextCycle
                ? 'engagements.form.termsSavedNext'
                : 'engagements.form.termsSaved'
            )
          )
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
            <DialogTitle>{t('engagements.form.termsTitle')}</DialogTitle>
            <DialogDescription>
              {t('engagements.form.termsHint')}
            </DialogDescription>
          </DialogHeader>
          {e.type !== 'project' && (
            <ChoiceRow
              label={t('engagements.form.period')}
              options={PERIODS}
              value={period}
              onChange={setPeriod}
              labelOf={(v) => t(`engagements.form.${v}`)}
            />
          )}
          <TextField
            id='terms-amount'
            label={`${t('engagements.form.amount')} (${e.currency})`}
            dir='ltr'
            inputMode='decimal'
            className='num'
            value={amount}
            onChange={setAmount}
          />
          {e.type === 'retainer' && (
            <TextField
              id='terms-hours'
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
            <Button type='submit' disabled={!isValid || update.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
