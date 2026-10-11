import { Panel } from '@/shared/components/panel'
import { useTranslation } from 'react-i18next'
import type { Client } from '@/features/clients/model/clients.schema'

/** Contact and billing facts about one client. */
export function ClientInfoPanel({
  client,
  identityName,
}: {
  client: Client
  identityName?: string
}) {
  const { t, i18n } = useTranslation()
  const localTime = new Intl.DateTimeFormat(
    i18n.language === 'en' ? 'en-GB' : 'ar-SA-u-nu-latn',
    { hour: '2-digit', minute: '2-digit', timeZone: client.timezone }
  ).format(new Date())

  return (
    <Panel bodyClassName='grid gap-3 text-sm'>
      <Row
        label='WhatsApp'
        value={
          client.whatsapp && <span className='num'>+{client.whatsapp}</span>
        }
      />
      {client.email && (
        <Row
          label={t('clients.form.email')}
          value={<span dir='ltr'>{client.email}</span>}
        />
      )}
      <Row label={t('clients.city')} value={client.city} />
      <Row
        label={t('clients.localTime')}
        value={<span className='num'>{localTime}</span>}
      />
      <Row
        label={t('clients.currency')}
        value={<span className='num'>{client.currency}</span>}
      />
      <Row label={t('clients.identity')} value={identityName} />
      {client.notes && (
        <p className='border-t pt-3 whitespace-pre-line text-muted-foreground'>
          {client.notes}
        </p>
      )}
    </Panel>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className='flex items-center justify-between gap-3'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-medium'>{value}</span>
    </div>
  )
}
