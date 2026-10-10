import { useDateFormat } from '@/shared/lib/dates'
import type { Currency } from '@/shared/money/currency'
import { useTranslation } from 'react-i18next'
import type { Client } from '@/features/clients/model/clients.schema'
import type { PaymentChannel } from '@/features/engagements/model/enums'
import { Money } from '@/features/rates/ui/money'
import type {
  BillingIdentity,
  PaymentMethod,
} from '@/features/settings/model/settings.schema'

type SheetItem = {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

export type SheetProps = {
  identity: BillingIdentity
  client: Client
  /** "—" while the invoice is only a preview. */
  number: string
  issueOn: string
  dueOn: string
  items: SheetItem[]
  currency: Currency
  amount: number
  methods: PaymentMethod[]
  channel?: PaymentChannel
}

/** The printable document body, styled by the client's billing identity. */
export function InvoiceSheet({
  identity,
  client,
  number,
  issueOn,
  dueOn,
  items,
  currency,
  amount,
  methods,
  channel,
}: SheetProps) {
  const { t } = useTranslation()
  const fmt = useDateFormat()
  return (
    <article className='print-area overflow-hidden rounded-xl border bg-white text-[#0d1f24] shadow-sm'>
      <div className='h-2' style={{ backgroundColor: identity.color }} />
      <div className='grid gap-8 p-6 sm:p-10'>
        <header className='flex flex-wrap items-start justify-between gap-6'>
          <div className='flex items-center gap-3'>
            <span
              className='grid size-12 place-items-center rounded-lg text-lg font-bold text-white'
              style={{ backgroundColor: identity.color }}
            >
              {identity.initials}
            </span>
            <div className='grid'>
              <span className='font-display text-lg font-semibold'>
                {identity.name}
              </span>
              <span className='text-xs text-[#5b6b6f]'>{identity.tagline}</span>
            </div>
          </div>
          <div className='grid gap-1 text-end'>
            <span className='font-display text-3xl font-semibold tracking-tight'>
              {t('invoice.title')}
            </span>
            <span className='num text-sm text-[#5b6b6f]'>{number}</span>
          </div>
        </header>

        <div className='grid gap-6 text-sm sm:grid-cols-3'>
          <div className='grid gap-1'>
            <span className='text-xs text-[#5b6b6f]'>
              {t('invoice.billTo')}
            </span>
            <span className='font-medium'>{client.company ?? client.name}</span>
            {client.company && <span>{client.name}</span>}
            <span className='num text-[#5b6b6f]'>+{client.whatsapp}</span>
          </div>
          <div className='grid gap-1'>
            <span className='text-xs text-[#5b6b6f]'>
              {t('invoice.issueDate')}
            </span>
            <span>{fmt(issueOn, 'd MMMM yyyy')}</span>
          </div>
          <div className='grid gap-1'>
            <span className='text-xs text-[#5b6b6f]'>
              {t('invoice.dueDate')}
            </span>
            <span className='font-medium'>{fmt(dueOn, 'd MMMM yyyy')}</span>
          </div>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full min-w-[480px] text-sm'>
            <thead>
              <tr className='border-b-2 border-[#0d1f24] text-xs'>
                <th className='py-2 text-start font-medium'>
                  {t('invoice.item')}
                </th>
                <th className='py-2 text-center font-medium'>
                  {t('invoice.qty')}
                </th>
                <th className='py-2 text-end font-medium'>
                  {t('invoice.price')}
                </th>
                <th className='py-2 text-end font-medium'>
                  {t('invoice.lineTotal')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className='border-b border-[#dde3e1]'>
                  <td className='py-3'>{item.description}</td>
                  <td className='num py-3 text-center'>{item.quantity}</td>
                  <td className='py-3 text-end'>
                    <Money amount={item.unitPrice} currency={currency} />
                  </td>
                  <td className='py-3 text-end'>
                    <Money amount={item.amount} currency={currency} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className='flex justify-end'>
          <div
            className='grid min-w-56 gap-1 rounded-lg p-4'
            style={{ backgroundColor: `${identity.color}14` }}
          >
            <span className='text-xs text-[#5b6b6f]'>{t('invoice.total')}</span>
            <Money
              amount={amount}
              currency={currency}
              className='text-2xl font-semibold'
            />
          </div>
        </div>

        <footer className='grid gap-3 border-t border-[#dde3e1] pt-6 text-sm'>
          <span className='text-xs font-medium text-[#5b6b6f]'>
            {t('invoice.payWith')}
          </span>
          {channel && (
            <p className='font-medium'>
              {t('invoice.agreedChannel', {
                channel: t(`channels.${channel}`),
              })}
            </p>
          )}
          <div className='grid gap-2 sm:grid-cols-2'>
            {methods.map((m) => (
              <div
                key={m.id}
                className='rounded-lg border border-[#dde3e1] p-3'
              >
                <div className='font-medium'>{m.label}</div>
                <div className='num text-xs text-[#5b6b6f]'>{m.details}</div>
              </div>
            ))}
          </div>
          <p className='text-xs text-[#5b6b6f]'>
            {t('invoice.thanks')} {identity.invoiceFooter}
          </p>
        </footer>
      </div>
    </article>
  )
}
