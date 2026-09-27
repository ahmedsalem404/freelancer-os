import { sql } from 'drizzle-orm'
import { check, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { id, inList, timestamps } from '../../../shared/db/columns'
import { TEMPLATE_KEYS, TEMPLATE_LOCALES } from '../model/templates'

/** Only the templates the owner edited; the rest use the built-in text. */
export const messageTemplates = sqliteTable(
  'message_templates',
  {
    id: id(),
    key: text({ enum: TEMPLATE_KEYS }).notNull(),
    locale: text({ enum: TEMPLATE_LOCALES }).notNull(),
    body: text().notNull(),
    ...timestamps(),
  },
  (t) => [
    check('template_key', sql`${t.key} IN ${inList(TEMPLATE_KEYS)}`),
    check('template_locale', sql`${t.locale} IN ${inList(TEMPLATE_LOCALES)}`),
    uniqueIndex('template_key_locale').on(t.key, t.locale),
  ]
)
