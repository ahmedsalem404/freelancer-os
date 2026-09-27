import { useRef, useState } from 'react'
import { useDb } from '@/app/client/snapshot-query'
import { ChoiceRow } from '@/shared/components/choice-row'
import { Panel } from '@/shared/components/panel'
import { PendingButton } from '@/shared/components/pending-button'
import { MessageSquareText, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useResetTemplate, useSaveTemplate } from '../api/use-templates'
import {
  renderTemplate,
  TEMPLATE_KEYS,
  TEMPLATE_LOCALES,
  TEMPLATE_VARS,
  type TemplateKey,
  type TemplateLocale,
  templateBody,
} from '../model/templates'

/** Sample values for the preview under the editor. */
const SAMPLE: Record<string, string> = {
  client_name: 'Sara',
  invoice_number: 'INV-2026-018',
  amount: '1,500 SAR',
  balance: '750 SAR',
  due_on: '2026-10-05',
  days_late: '7',
  pay_methods: '• Bank: SA00 0000 0000',
  service: 'Social media',
  ends_on: '2026-10-30',
  link: 'https://example.com/p/…',
}

/** Edit the WhatsApp texts the app sends, per language. */
export function TemplatesPanel() {
  const { t } = useTranslation()
  const saved = useDb().templates
  const save = useSaveTemplate()
  const reset = useResetTemplate()
  const [key, setKey] = useState<TemplateKey>('invoice_send')
  const [locale, setLocale] = useState<TemplateLocale>('ar')
  const current = templateBody(saved, key, locale)
  const [draft, setDraft] = useState<{ id: string; body: string }>()
  const id = `${key}:${locale}`
  const body = draft?.id === id ? draft.body : current
  const isEdited = saved.some((s) => s.key === key && s.locale === locale)
  const editor = useRef<HTMLTextAreaElement>(null)

  const insert = (name: string) => {
    const el = editor.current
    const at = el?.selectionStart ?? body.length
    const next = `${body.slice(0, at)}{{${name}}}${body.slice(at)}`
    setDraft({ id, body: next })
  }

  return (
    <Panel
      title={
        <span className='flex items-center gap-2'>
          <MessageSquareText className='size-4' /> {t('templates.title')}
        </span>
      }
      className='lg:col-span-2'
      bodyClassName='grid gap-4'
    >
      <p className='text-xs text-muted-foreground'>{t('templates.hint')}</p>
      <div className='grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]'>
        <div className='grid gap-2'>
          <Label htmlFor='template-key'>{t('templates.which')}</Label>
          <Select value={key} onValueChange={(v) => setKey(v as TemplateKey)}>
            <SelectTrigger id='template-key' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_KEYS.map((k) => (
                <SelectItem key={k} value={k}>
                  {t(`templates.keys.${k}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ChoiceRow
          label={t('common.language')}
          options={TEMPLATE_LOCALES}
          value={locale}
          onChange={setLocale}
          labelOf={(l) => (l === 'ar' ? 'العربية' : 'English')}
        />
      </div>
      <div className='grid gap-2'>
        <Textarea
          ref={editor}
          aria-label={t(`templates.keys.${key}`)}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          rows={7}
          value={body}
          onChange={(e) => setDraft({ id, body: e.target.value })}
        />
        <div className='flex flex-wrap gap-1.5'>
          {TEMPLATE_VARS[key].map((name) => (
            <button
              key={name}
              type='button'
              onClick={() => insert(name)}
              className='rounded-full border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground'
            >
              {t(`templates.vars.${name}`)}
            </button>
          ))}
        </div>
      </div>
      <div className='grid gap-1'>
        <span className='text-xs font-medium'>{t('templates.preview')}</span>
        <p
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
          className='rounded-lg bg-muted/60 p-3 text-sm whitespace-pre-wrap'
        >
          {renderTemplate(body, SAMPLE)}
        </p>
      </div>
      <div className='flex flex-wrap justify-end gap-2'>
        {isEdited && (
          <Button
            variant='ghost'
            disabled={reset.isPending}
            onClick={() =>
              reset.mutate(
                { key, locale },
                {
                  onSuccess: () => {
                    setDraft(undefined)
                    toast.success(t('templates.resetDone'))
                  },
                }
              )
            }
          >
            <RotateCcw /> {t('templates.reset')}
          </Button>
        )}
        <PendingButton
          disabled={body.trim() === '' || body === current}
          isPending={save.isPending}
          onClick={() =>
            save.mutate(
              { key, locale, body },
              { onSuccess: () => toast.success(t('templates.saved')) }
            )
          }
        >
          {t('common.save')}
        </PendingButton>
      </div>
    </Panel>
  )
}
