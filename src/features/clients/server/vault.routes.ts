import { success } from '@/shared/http/envelope'
import { jsonBody } from '@/shared/http/validate'
import type { AppEnv } from '@/shared/server/context'
import type { Storage } from '@/shared/server/storage'
import { Hono } from 'hono'
import { vaultEntryInput, vaultEntryUpdate } from '../model/vault.input'
import {
  addVaultEntry,
  deleteVaultEntry,
  revealVaultEntry,
  updateVaultEntry,
} from './vault.service'

/** Owner-only (not in the gate's ANY_MEMBER list): assistants never reach it. */
export const createVaultRoutes = (storage: Storage) =>
  new Hono<AppEnv>()
    .post('/clients/:id/vault', jsonBody(vaultEntryInput), (c) => {
      const clientId = c.req.param('id')
      const input = c.req.valid('json')
      const saved = c.var.run((ctx) =>
        addVaultEntry(ctx, storage, clientId, input)
      )
      return c.json(success(saved), 201)
    })
    .put('/vault/:id', jsonBody(vaultEntryUpdate), (c) => {
      const id = c.req.param('id')
      const input = c.req.valid('json')
      return c.json(
        success(c.var.run((ctx) => updateVaultEntry(ctx, storage, id, input)))
      )
    })
    .delete('/vault/:id', (c) => {
      const id = c.req.param('id')
      return c.json(success(c.var.run((ctx) => deleteVaultEntry(ctx, id))))
    })
    .post('/vault/:id/reveal', (c) => {
      const id = c.req.param('id')
      c.header('cache-control', 'no-store')
      return c.json(
        success(c.var.run((ctx) => revealVaultEntry(ctx, storage, id)))
      )
    })
