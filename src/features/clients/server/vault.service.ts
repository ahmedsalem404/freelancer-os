import { newId } from '@/shared/db/new-id'
import { DomainError, required } from '@/shared/http/errors'
import type { Ctx } from '@/shared/server/context'
import type { Storage } from '@/shared/server/storage'
import { eq } from 'drizzle-orm'
import type { VaultEntryChanges, VaultEntryFields } from '../model/vault.input'
import { clients, vaultEntries } from './clients.table'
import { open, seal, vaultKey } from './vault-crypto'

type Secret = { secret: string; notes?: string }
type SealedRow = { id: string; ciphertext: string | null; nonce: string | null }

const sealSecret = (storage: Storage, id: string, secret: Secret) =>
  seal(vaultKey(storage, { create: true }), id, JSON.stringify(secret))

function readSecret(storage: Storage, row: SealedRow): Secret {
  if (!row.ciphertext || !row.nonce) {
    throw new DomainError('vault_empty', 'No secret is saved here', 404)
  }
  const plain = open(vaultKey(storage), row.id, {
    ciphertext: row.ciphertext,
    nonce: row.nonce,
  })
  return JSON.parse(plain) as Secret
}

function entryOf(ctx: Ctx, id: string) {
  return required(
    ctx.db.select().from(vaultEntries).where(eq(vaultEntries.id, id)).get(),
    'Vault entry',
    id
  )
}

/** Saves a login; only its label, URL and username stay readable. */
export function addVaultEntry(
  ctx: Ctx,
  storage: Storage,
  clientId: string,
  input: VaultEntryFields
) {
  required(
    ctx.db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.id, clientId))
      .get(),
    'Client',
    clientId
  )
  const id = newId('vault')
  ctx.db
    .insert(vaultEntries)
    .values({
      id,
      clientId,
      label: input.label,
      url: input.url ?? null,
      username: input.username ?? null,
      ...sealSecret(storage, id, { secret: input.secret, notes: input.notes }),
    })
    .run()
  return { id }
}

/** Edits an entry; the secret is sealed again with a fresh nonce. */
export function updateVaultEntry(
  ctx: Ctx,
  storage: Storage,
  id: string,
  input: VaultEntryChanges
) {
  const row = entryOf(ctx, id)
  // Blank fields keep what is saved (the form never shows the old secret).
  const kept = row.ciphertext ? readSecret(storage, row) : undefined
  const secret = input.secret ?? kept?.secret
  const notes = input.notes ?? kept?.notes
  if (!secret) {
    throw new DomainError('vault_empty', 'Type the secret to save', 422)
  }
  ctx.db
    .update(vaultEntries)
    .set({
      label: input.label,
      url: input.url ?? null,
      username: input.username ?? null,
      ...sealSecret(storage, id, { secret, notes }),
    })
    .where(eq(vaultEntries.id, id))
    .run()
  return { id }
}

export function deleteVaultEntry(ctx: Ctx, id: string) {
  entryOf(ctx, id)
  ctx.db.delete(vaultEntries).where(eq(vaultEntries.id, id)).run()
  return { id }
}

/** Decrypts one entry on the owner's explicit request. */
export function revealVaultEntry(ctx: Ctx, storage: Storage, id: string) {
  const { secret, notes } = readSecret(storage, entryOf(ctx, id))
  return { secret, notes }
}
