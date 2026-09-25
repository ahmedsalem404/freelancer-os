import { ChoiceRow } from '@/shared/components/choice-row'
import { TextField } from '@/shared/components/text-field'
import { todayIso } from '@/shared/model/dates'
import { CURRENCIES, type Currency } from '@/shared/money/currency'
import { toMajor, toMinor } from '@/shared/money/money'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSaveExpense } from '../api/use-expenses'
import { expenseInput } from '../model/expense.input'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '../model/enums'
import type { Expense } from '../model/finance.schema'

type Props = {
  /** The expense to edit; omitted to record a new one. */
  expense?: Expense
  onClose: () => void
}

/** Record an expense, or correct one. */
export function ExpenseFormDialog({ expense, onClose }: Props) {
  const { t } = useTranslation()
  const save = useSaveExpense()
  const [title, setTitle] = useState(expense?.title ?? '')
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? 'software'
  )
  const [amount, setAmount] = useState(
    expense ? String(toMajor(expense.amount)) : ''
  )
  const [currency, setCurrency] = useState<Currency>(expense?.currency ?? 'SAR')
  const [spentOn, setSpentOn] = useState(expense?.spentOn ?? todayIso())
  const [vendor, setVendor] = useState(expense?.vendor ?? '')
  const [note, setNote] = useState(expense?.note ?? '')
  const body = {
    title,
    category,
    amountMinor: toMinor(Number(amount)),
    currency,
    spentOn,
    vendor,
    note,
  }
  const isValid = expenseInput.safeParse(body).success

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || save.isPending) return
    save.mutate(
      { ...body, id: expense?.id },
      {
        onSuccess: () => {
          toast.success(t('finance.expenseForm.saved'))
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-md'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {t(expense ? 'finance.expenseForm.edit' : 'finance.addExpense')}
            </DialogTitle>
          </DialogHeader>
          <TextField
            id='expense-title'
            label={t('finance.expenseForm.title')}
            value={title}
            onChange={setTitle}
          />
          <div className='grid gap-2'>
            <Label htmlFor='expense-category'>
              {t('finance.expenseForm.category')}
            </Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ExpenseCategory)}
            >
              <SelectTrigger id='expense-category' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`finance.category.${c}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <TextField
              id='expense-amount'
              label={t('finance.expenseForm.amount')}
              dir='ltr'
              inputMode='decimal'
              className='num'
              value={amount}
              onChange={setAmount}
            />
            <TextField
              id='expense-date'
              label={t('finance.expenseForm.spentOn')}
              type='date'
              dir='ltr'
              value={spentOn}
              onChange={setSpentOn}
            />
          </div>
          <ChoiceRow
            label={t('finance.expenseForm.currency')}
            options={CURRENCIES}
            value={currency}
            onChange={setCurrency}
            labelOf={(c) => c}
          />
          <TextField
            id='expense-vendor'
            label={t('finance.expenseForm.vendor')}
            value={vendor}
            onChange={setVendor}
          />
          <TextField
            id='expense-note'
            label={t('finance.expenseForm.note')}
            value={note}
            onChange={setNote}
            isMultiline
          />
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type='submit' disabled={!isValid || save.isPending}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
