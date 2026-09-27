import { useLang } from '@/shared/lib/dates'
import {
  renderTemplate,
  type TemplateKey,
  templateBody,
} from '@/features/settings/model/templates'
import { useDb } from './snapshot-query'

type Vars = Partial<Record<string, string | number>>

/**
 * Fills a WhatsApp template in the current language: the owner's edited
 * text from Settings, or the built-in one.
 */
export function useMessageTemplate() {
  const templates = useDb().templates
  const lang = useLang()
  return (key: TemplateKey, vars: Vars) =>
    renderTemplate(templateBody(templates, key, lang), vars)
}
