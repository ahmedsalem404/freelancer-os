import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
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
import { ChoiceRow } from '@/shared/components/choice-row'

const PERIODS = ['monthly', 'yearly'] as const
const DEFAULT_HOURS = '10'

type Props = { lead: Lead; onClose: () => void }

/** Won → the client and the engagement it opens, in one step. */
export function ConvertLeadDialog({ lead, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const convert = useConvertLead()
  const [title, setTitle] = useState(lead.service)
  const [type, setType] = useState<EngagementType>('project')
  const [amount, setAmount] = useState(String(toMajor(lead.amount)))
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('monthly')
  const [hours, setHours] = useState(DEFAULT_HOURS)
  const name = lead.company ?? lead.name
  const isValid =
    title.trim().length > 0 &&
    Number(amount) >= 0 &&
    (type !== 'retainer' || Number(hours) > 0)

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
        includedHours: type === 'retainer' ? Number(hours) : undefined,
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
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            {type === 'retainer' && (
              <div className='grid gap-2'>
                <Label htmlFor='convert-hours'>
                  {t('leads.convert.hours')}
                </Label>
                <Input
                  id='convert-hours'
                  dir='ltr'
                  inputMode='decimal'
                  className='num'
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={!isValid || convert.isPending}>
              {t('leads.convert.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
