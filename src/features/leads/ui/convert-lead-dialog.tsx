import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ChoiceRow } from '@/shared/components/choice-row'
import { PendingButton } from '@/shared/components/pending-button'
import { useFieldErrors } from '@/shared/lib/use-field-errors'
import { todayIso } from '@/shared/model/dates'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ENGAGEMENT_TYPES,
  type EngagementType,
} from '@/features/engagements/model/enums'
import { useConvertLead } from '../api/use-convert-lead'
import type { Lead } from '../model/lead.schema'

const PERIODS = ['monthly', 'yearly'] as const

type Props = { lead: Lead; onClose: () => void }

/** Won → the client and the engagement it opens, in one step. */
export function ConvertLeadDialog({ lead, onClose }: Props) {
  const { t } = useTranslation()
  const { positive } = useFieldErrors()
  const navigate = useNavigate()
  const convert = useConvertLead()
  const [title, setTitle] = useState(lead.service)
  const [type, setType] = useState<EngagementType>('project')
  const [amount, setAmount] = useState(String(toMajor(lead.amount)))
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('monthly')
  const name = lead.company ?? lead.name
  const isValid = title.trim().length > 0 && Number(amount) >= 0

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || convert.isPending) return
    convert.mutate(
      {
        leadId: lead.id,
        title: title.trim(),
        type,
        amountMinor: toMinor(Number(amount)),
        startOn: todayIso(),
        cyclePeriod: type === 'project' ? undefined : period,
      },
      {
        onSuccess: ({ engagementId }) => {
          toast.success(t('leads.convert.done', { name }))
          onClose()
          navigate({ to: '/engagements/$id', params: { id: engagementId } })
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>{t('leads.convert.title', { name })}</DialogTitle>
            <DialogDescription>{t('leads.convert.hint')}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-2'>
            <Label htmlFor='convert-title'>
              {t('leads.convert.engagementTitle')}
            </Label>
            <Input
              id='convert-title'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <ChoiceRow
            label={t('leads.convert.type')}
            options={ENGAGEMENT_TYPES}
            value={type}
            onChange={setType}
            labelOf={(v) => t(`types.${v}`)}
          />
          {type !== 'project' && (
            <ChoiceRow
              label={t('leads.convert.period')}
              options={PERIODS}
              value={period}
              onChange={setPeriod}
              labelOf={(v) => t(`leads.convert.${v}`)}
            />
          )}
          <div className='grid grid-cols-2 gap-3'>
            <div className='grid gap-2'>
              <Label htmlFor='convert-amount'>
                {t('leads.convert.amount')} ({lead.currency})
              </Label>
              <Input
                id='convert-amount'
                dir='ltr'
                inputMode='decimal'
                className='num'
                value={amount}
                aria-invalid={positive(amount) ? true : undefined}
                onChange={(e) => setAmount(e.target.value)}
              />
              {positive(amount) && (
                <p className='text-xs text-destructive'>{positive(amount)}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <PendingButton
              type='submit'
              disabled={!isValid}
              isPending={convert.isPending}
            >
              {t('leads.convert.submit')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
