import { useDb } from '@/app/client/snapshot-query'
import { ConfirmDialog } from '@/shared/components/confirm-dialog'
import { EmptyState } from '@/shared/components/empty-state'
import { Panel } from '@/shared/components/panel'
import { useDateFormat } from '@/shared/lib/dates'
import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Money } from '@/features/rates/ui/money'
import { useDeleteExpense } from '../api/use-expenses'
import type { Expense } from '../model/finance.schema'
import { ExpenseFormDialog } from './expense-form-dialog'

/** Which dialog is open: a new expense, one to edit, or one to delete. */
type Open =
  | { kind: 'add' }
  | { kind: 'edit'; expense: Expense }
  | { kind: 'delete'; expense: Expense }

/** Expenses with add, edit and delete. */
export function ExpensesPanel() {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  const expenses = useDb().expenses
  const remove = useDeleteExpense()
  const [open, setOpen] = useState<Open>()
  const close = () => setOpen(undefined)

  const confirmDelete = (expense: Expense) =>
    remove.mutate(expense.id, {
      onSuccess: () => {
        toast.success(t('finance.expenseForm.deleted'))
        close()
      },
    })

  return (
    <Panel
      title={t('finance.tabs.expenses')}
      action={
        <Button size='sm' onClick={() => setOpen({ kind: 'add' })}>
          <Plus /> {t('finance.addExpense')}
        </Button>
      }
      bodyClassName='p-0'
    >
      {expenses.length === 0 ? (
        <EmptyState>{t('common.empty')}</EmptyState>
      ) : (
        <ul className='divide-y'>
          {expenses.map((x) => (
            <li
              key={x.id}
              className='flex items-center justify-between gap-3 px-4 py-3 text-sm'
            >
              <div className='grid min-w-0 gap-0.5'>
                <span className='truncate'>{x.title}</span>
                <span className='text-xs text-muted-foreground'>
                  {t(`finance.category.${x.category}`)} · {fmt(x.spentOn)}
                  {x.vendor && ` · ${x.vendor}`}
                </span>
              </div>
              <div className='flex shrink-0 items-center gap-1'>
                <Money
                  amount={x.amount}
                  currency={x.currency}
                  rateToBase={x.rateToBase}
                  showBase
                />
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={t('finance.expenseForm.edit')}
                  onClick={() => setOpen({ kind: 'edit', expense: x })}
                >
                  <Pencil />
                </Button>
                <Button
                  size='icon'
                  variant='ghost'
                  aria-label={t('finance.expenseForm.delete')}
                  onClick={() => setOpen({ kind: 'delete', expense: x })}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open?.kind === 'add' && <ExpenseFormDialog onClose={close} />}
      {open?.kind === 'edit' && (
        <ExpenseFormDialog expense={open.expense} onClose={close} />
      )}
      {open?.kind === 'delete' && (
        <ConfirmDialog
          open
          onOpenChange={(isOpen) => !isOpen && close()}
          destructive
          title={t('finance.expenseForm.deleteTitle')}
          desc={t('finance.expenseForm.deleteHint', {
            title: open.expense.title,
          })}
          confirmText={t('finance.expenseForm.delete')}
          cancelBtnText={t('common.cancel')}
          isLoading={remove.isPending}
          handleConfirm={() => confirmDelete(open.expense)}
        />
      )}
    </Panel>
  )
}
