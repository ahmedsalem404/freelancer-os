import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { emptyLine, type LineDraft } from './line-draft'

type Props = {
  lines: LineDraft[]
  currency: string
  onChange: (lines: LineDraft[]) => void
}

/** Invoice lines: description, quantity and unit price, add and remove. */
export function InvoiceLinesEditor({ lines, currency, onChange }: Props) {
  const { t } = useTranslation()
  const update = (key: number, patch: Partial<LineDraft>) =>
    onChange(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)))

  return (
    <fieldset className='grid gap-2'>
      <legend className='mb-2 text-sm font-medium'>
        {t('invoice.form.lines')}
      </legend>
      {lines.map((line, index) => (
        <div
          key={line.key}
          className='grid grid-cols-[minmax(0,1fr)_4rem_6rem_auto] items-end gap-2'
        >
          <div className='grid gap-1'>
            {index === 0 && (
              <Label htmlFor={`line-desc-${line.key}`} className='text-xs'>
                {t('invoice.item')}
              </Label>
            )}
            <Input
              id={`line-desc-${line.key}`}
              aria-label={t('invoice.item')}
              value={line.description}
              onChange={(e) => update(line.key, { description: e.target.value })}
            />
          </div>
          <div className='grid gap-1'>
            {index === 0 && <Label className='text-xs'>{t('invoice.qty')}</Label>}
            <Input
              aria-label={t('invoice.qty')}
              dir='ltr'
              inputMode='decimal'
              className='num'
              value={line.quantity}
              onChange={(e) => update(line.key, { quantity: e.target.value })}
            />
          </div>
          <div className='grid gap-1'>
            {index === 0 && (
              <Label className='text-xs'>
                {t('invoice.price')} ({currency})
              </Label>
            )}
            <Input
              aria-label={t('invoice.price')}
              dir='ltr'
              inputMode='decimal'
              className='num'
              value={line.price}
              onChange={(e) => update(line.key, { price: e.target.value })}
            />
          </div>
          <Button
            type='button'
            size='icon'
            variant='ghost'
            aria-label={t('invoice.form.removeLine')}
            disabled={lines.length === 1}
            onClick={() => onChange(lines.filter((l) => l.key !== line.key))}
          >
            <Trash2 />
          </Button>
        </div>
      ))}
      <Button
        type='button'
        variant='outline'
        size='sm'
        className='justify-self-start'
        onClick={() => onChange([...lines, emptyLine()])}
      >
        <Plus /> {t('invoice.form.addLine')}
      </Button>
    </fieldset>
  )
}
