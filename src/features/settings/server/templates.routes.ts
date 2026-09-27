import { newId } from '@/shared/db/new-id'
import { success } from '@/shared/http/envelope'
import { DomainError } from '@/shared/http/errors'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import { and, eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { templateInput } from '../model/template.schema'
import {
  TEMPLATE_KEYS,
  TEMPLATE_LOCALES,
  type TemplateKey,
  type TemplateLocale,
} from '../model/templates'
import { messageTemplates } from './templates.table'

function keyOf(raw: string): TemplateKey {
  const key = TEMPLATE_KEYS.find((k) => k === raw)
  if (!key) throw new DomainError('not_found', `Unknown template ${raw}`, 404)
  return key
}

function localeOf(raw: string): TemplateLocale {
  const locale = TEMPLATE_LOCALES.find((l) => l === raw)
  if (!locale) throw new DomainError('not_found', `Unknown locale ${raw}`, 404)
  return locale
}

const where = (key: TemplateKey, locale: TemplateLocale) =>
  and(eq(messageTemplates.key, key), eq(messageTemplates.locale, locale))

/** Owner-only: edit a template, or reset it to the built-in text. */
export const templatesRoutes = new Hono<AppEnv>()
  .put('/templates/:key', jsonBody(templateInput), (c) => {
    const key = keyOf(c.req.param('key'))
    const { locale, body } = c.req.valid('json')
    c.var.run((ctx) =>
      ctx.db
        .insert(messageTemplates)
        .values({ id: newId('tpl'), key, locale, body })
        .onConflictDoUpdate({
          target: [messageTemplates.key, messageTemplates.locale],
          set: { body, updatedAt: ctx.now },
        })
        .run()
    )
    return c.json(success({ key, locale }))
  })
  .delete('/templates/:key/:locale', (c) => {
    const key = keyOf(c.req.param('key'))
    const locale = localeOf(c.req.param('locale'))
    c.var.run((ctx) =>
      ctx.db.delete(messageTemplates).where(where(key, locale)).run()
    )
    return c.json(success({ key, locale }))
  })
