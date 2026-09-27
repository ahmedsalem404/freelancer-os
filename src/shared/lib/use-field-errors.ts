import { useTranslation } from 'react-i18next'

/**
 * Inline reasons for a field the save button refuses. An empty field says
 * nothing (the user hasn't typed yet); a typed but wrong one says why.
 */
export function useFieldErrors() {
  const { t } = useTranslation()
  return {
    /** A number that must be above zero (amounts, hours, fees). */
    positive: (value: string): string | undefined =>
      value.trim() !== '' && !(Number(value) > 0)
        ? t('common.mustBePositive')
        : undefined,
  }
}
