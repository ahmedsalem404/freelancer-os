import { useDb } from '@/app/client/snapshot-query'
import { useTranslation } from 'react-i18next'
import { quoteFormat } from './quote-format'

const HISTORY_SHOWN = 4

export function RateHistory() {
  const { t } = useTranslation()
  const dailyRates = useDb().dailyRates
  return (
    <div className='grid gap-1.5 border-t pt-3'>
      <div className='text-xs font-medium text-muted-foreground'>
        {t('rates.history')}
      </div>
      <table className='w-full text-xs'>
        <thead className='text-muted-foreground'>
          <tr>
            <th className='py-1 text-start font-normal'>{t('rates.day')}</th>
            <th className='py-1 text-end font-normal'>SAR</th>
            <th className='py-1 text-end font-normal'>USD</th>
          </tr>
        </thead>
        <tbody>
          {dailyRates.slice(0, HISTORY_SHOWN).map((r) => (
            <tr key={r.day} className='border-t border-dashed'>
              <td className='py-1 text-start'>
                <span className='num'>{r.day}</span>
              </td>
              <td className='py-1 text-end'>
                <span className='num'>{quoteFormat.format(r.sarInYer)}</span>
              </td>
              <td className='py-1 text-end'>
                <span className='num'>{quoteFormat.format(r.usdInYer)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
