import { useTranslation } from 'react-i18next'

/**
 * Says which required fields still block the save button, so a disabled
 * button is never a mystery. Renders nothing once everything is filled.
 */
export function MissingFields({ fields }: { fields: (string | false)[] }) {
  const { t, i18n } = useTranslation()
  const separator = i18n.language === 'ar' ? '، ' : ', '
  const missing = fields.filter((f): f is string => Boolean(f))
  if (missing.length === 0) return null
  return (
    <p role='status' className='text-xs text-muted-foreground'>
      {t('common.fillToSave', { fields: missing.join(separator) })}
    </p>
  )
}
