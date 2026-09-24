import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core'
import { id, inList, timestamps } from '../../../shared/db/columns'
import { CURRENCIES } from '../../../shared/money/currency'
import { billingIdentities } from '../../settings/server/identities.table'
import { CLIENT_KINDS } from '../model/enums'

/** Clients. Health and "since" are derived, never stored. */
export const clients = sqliteTable(
  'clients',
  {
    id: id(),
    kind: text({ enum: CLIENT_KINDS }).notNull(),
    name: text().notNull(),
    company: text(),
    billingIdentityId: text()
      .notNull()
      .references(() => billingIdentities.id),
    whatsapp: text(),
    email: text(),
    city: text(),
    country: text(),
    timezone: text().notNull().default('Asia/Riyadh'),
    currency: text({ enum: CURRENCIES }).notNull().default('SAR'),
    color: text().notNull(),
    leadSource: text(),
    notes: text(),
    archivedAt: text(),
    ...timestamps(),
  },
  (t) => [
    check('client_kind', sql`${t.kind} IN ${inList(CLIENT_KINDS)}`),
    check('client_currency', sql`${t.currency} IN ${inList(CURRENCIES)}`),
    index('clients_name').on(t.archivedAt, t.name),
    index('clients_identity').on(t.billingIdentityId),
  ]
)

/**
 * Access vault. Labels are plaintext; the secret is stored only as AEAD
 * ciphertext once the vault phase lands (ARCHITECTURE.md §6, phase 3) —
 * until then `ciphertext`/`nonce` stay NULL and "reveal" is locked.
 */
export const vaultEntries = sqliteTable(
  'vault_entries',
  {
    id: id(),
    clientId: text()
      .notNull()
      .references(() => clients.id, { onDelete: 'cascade' }),
    label: text().notNull(),
    url: text(),
    username: text(),
    ciphertext: text(),
    nonce: text(),
    algo: text().notNull().default('aes-256-gcm'),
    keyVersion: integer().notNull().default(1),
    ...timestamps(),
  },
  (t) => [index('vault_client').on(t.clientId)]
)
