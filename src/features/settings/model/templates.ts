/**
 * WhatsApp message templates. Built-in texts (per language) apply until the
 * owner edits one in Settings; `{{name}}` placeholders are filled per message.
 * Messages read as coming "from the system" so a reminder never feels personal.
 */
export const TEMPLATE_KEYS = [
  'invoice_send',
  'reminder_due',
  'reminder_overdue',
  'renewal_notice',
  'portal_link',
  'lead_follow_up',
] as const

export type TemplateKey = (typeof TEMPLATE_KEYS)[number]
export const TEMPLATE_LOCALES = ['ar', 'en'] as const
export type TemplateLocale = (typeof TEMPLATE_LOCALES)[number]

/** Which placeholders each template can use (shown as chips in Settings). */
export const TEMPLATE_VARS: Record<TemplateKey, readonly string[]> = {
  invoice_send: [
    'client_name',
    'invoice_number',
    'amount',
    'due_on',
    'pay_methods',
  ],
  reminder_due: [
    'client_name',
    'invoice_number',
    'balance',
    'due_on',
    'pay_methods',
  ],
  reminder_overdue: [
    'client_name',
    'invoice_number',
    'balance',
    'due_on',
    'days_late',
    'pay_methods',
  ],
  renewal_notice: ['client_name', 'service', 'ends_on', 'amount'],
  portal_link: ['client_name', 'service', 'link'],
  lead_follow_up: ['client_name', 'service'],
}

export const DEFAULT_TEMPLATES: Record<
  TemplateLocale,
  Record<TemplateKey, string>
> = {
  ar: {
    invoice_send:
      'مرحباً {{client_name}}،\nهذه فاتورة رقم {{invoice_number}} بمبلغ {{amount}}، تاريخ الاستحقاق {{due_on}}.\n\nطرق الدفع:\n{{pay_methods}}\n\nشكراً لك.',
    reminder_due:
      'مرحباً {{client_name}}،\nتذكير آلي من النظام: الفاتورة {{invoice_number}} مستحقة بتاريخ {{due_on}}، والمتبقي {{balance}}.\n\nطرق الدفع:\n{{pay_methods}}',
    reminder_overdue:
      'مرحباً {{client_name}}،\nتذكير آلي من النظام: الفاتورة {{invoice_number}} متأخرة {{days_late}} يوم عن موعدها ({{due_on}})، والمتبقي {{balance}}.\n\nطرق الدفع:\n{{pay_methods}}',
    renewal_notice:
      'مرحباً {{client_name}}،\nتذكير آلي: اشتراك «{{service}}» ينتهي بتاريخ {{ends_on}}. قيمة التجديد {{amount}}.\nهل نجدد؟',
    portal_link:
      'مرحباً {{client_name}}،\nتقدر تتابع سير العمل في «{{service}}» وتعتمد المخرجات من هذا الرابط:\n{{link}}',
    lead_follow_up:
      'مرحباً {{client_name}}،\nحبيت أتابع معك بخصوص «{{service}}». هل عندك أي سؤال أو نبدأ؟',
  },
  en: {
    invoice_send:
      'Hello {{client_name}},\nHere is invoice {{invoice_number}} for {{amount}}, due {{due_on}}.\n\nPayment methods:\n{{pay_methods}}\n\nThank you.',
    reminder_due:
      'Hello {{client_name}},\nAn automatic reminder: invoice {{invoice_number}} is due on {{due_on}}; {{balance}} remains.\n\nPayment methods:\n{{pay_methods}}',
    reminder_overdue:
      'Hello {{client_name}},\nAn automatic reminder: invoice {{invoice_number}} is {{days_late}} days past its due date ({{due_on}}); {{balance}} remains.\n\nPayment methods:\n{{pay_methods}}',
    renewal_notice:
      'Hello {{client_name}},\nAn automatic reminder: your "{{service}}" subscription ends on {{ends_on}}. Renewal is {{amount}}.\nShall we renew?',
    portal_link:
      'Hello {{client_name}},\nFollow the work on "{{service}}" and approve deliverables here:\n{{link}}',
    lead_follow_up:
      'Hello {{client_name}},\nFollowing up on "{{service}}" — any questions, or shall we start?',
  },
}

/** Fills `{{name}}` placeholders; an unknown one is left as typed. */
export function renderTemplate(
  body: string,
  vars: Partial<Record<string, string | number>>
): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, name: string) => {
    const value = vars[name]
    return value === undefined ? whole : String(value)
  })
}

/** The owner's edited text, or the built-in one. */
export function templateBody(
  saved: readonly { key: string; locale: string; body: string }[],
  key: TemplateKey,
  locale: TemplateLocale
): string {
  return (
    saved.find((s) => s.key === key && s.locale === locale)?.body ??
    DEFAULT_TEMPLATES[locale][key]
  )
}
