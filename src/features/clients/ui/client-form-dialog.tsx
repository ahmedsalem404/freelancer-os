import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useDb } from '@/app/client/snapshot-query'
import { ChoiceRow } from '@/shared/components/choice-row'
import { PendingButton } from '@/shared/components/pending-button'
import { TextField } from '@/shared/components/text-field'
import { CURRENCIES, type Currency } from '@/shared/money/currency'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSaveClient } from '../api/use-save-client'
import { type ClientInput, clientInput } from '../model/client.input'
import type { Client } from '../model/clients.schema'

type Form = Required<{ [K in keyof ClientInput]: string }>

type Props = {
  /** The client to edit; omitted to add a new one. */
  client?: Client
  onClose: () => void
}

function initialForm(client: Client | undefined, identityId: string): Form {
  return {
    name: client?.name ?? '',
    company: client?.company ?? '',
    whatsapp: client?.whatsapp ?? '',
    email: client?.email ?? '',
    city: client?.city ?? '',
    currency: client?.currency ?? 'SAR',
    billingIdentityId: client?.billingIdentityId ?? identityId,
    notes: client?.notes ?? '',
  }
}

/** Add a client, or edit one. */
export function ClientFormDialog({ client, onClose }: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const db = useDb()
  const save = useSaveClient()
  const [form, setForm] = useState(() =>
    initialForm(client, db.identities[0]?.id ?? '')
  )
  const parsed = clientInput.safeParse(form)
  const badField = parsed.success ? undefined : parsed.error.issues[0]?.path[0]
  const set = (key: keyof Form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!parsed.success || save.isPending) return
    save.mutate(
      { ...form, currency: parsed.data.currency, clientId: client?.id },
      {
        onSuccess: ({ id }) => {
          toast.success(
            t(client ? 'clients.form.updated' : 'clients.form.created')
          )
          onClose()
          if (!client) navigate({ to: '/clients/$id', params: { id } })
        },
      }
    )
  }

  const hintFor = (key: 'whatsapp' | 'email') =>
    badField === key && form[key] !== ''
      ? t(`clients.form.bad.${key}`)
      : undefined

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-h-[90dvh] overflow-y-auto sm:max-w-lg'>
        <form onSubmit={submit} className='grid gap-4'>
          <DialogHeader className='text-start'>
            <DialogTitle>
              {client ? t('clients.form.editTitle') : t('clients.add')}
            </DialogTitle>
            <DialogDescription>{t('clients.form.hint')}</DialogDescription>
          </DialogHeader>
          <div className='grid gap-3 sm:grid-cols-2'>
            <TextField
              id='client-name'
              label={t('clients.form.name')}
              value={form.name}
              onChange={set('name')}
              autoFocus
            />
            <TextField
              id='client-company'
              label={t('clients.form.company')}
              value={form.company}
              onChange={set('company')}
            />
            <TextField
              id='client-whatsapp'
              label='WhatsApp'
              dir='ltr'
              inputMode='numeric'
              className='num'
              placeholder='967771234567'
              value={form.whatsapp}
              onChange={set('whatsapp')}
              hint={hintFor('whatsapp')}
            />
            <TextField
              id='client-email'
              label={t('clients.form.email')}
              dir='ltr'
              type='email'
              value={form.email}
              onChange={set('email')}
              hint={hintFor('email')}
            />
            <TextField
              id='client-city'
              label={t('clients.city')}
              value={form.city}
              onChange={set('city')}
            />
            <ChoiceRow
              label={t('clients.currency')}
              options={CURRENCIES}
              value={form.currency as Currency}
              onChange={set('currency')}
              labelOf={(c) => c}
            />
          </div>
          {db.identities.length > 1 && (
            <ChoiceRow
              label={t('clients.identity')}
              options={db.identities.map((i) => i.id)}
              value={form.billingIdentityId}
              onChange={set('billingIdentityId')}
              labelOf={(id) =>
                db.identities.find((i) => i.id === id)?.name ?? id
              }
            />
          )}
          <TextField
            id='client-notes'
            label={t('clients.form.notes')}
            value={form.notes}
            onChange={set('notes')}
            isMultiline
          />
          <DialogFooter>
            <Button type='button' variant='ghost' onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <PendingButton
              type='submit'
              disabled={!parsed.success}
              isPending={save.isPending}
            >
              {t('common.save')}
            </PendingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
