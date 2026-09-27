/** Server-side public surface of `clients` (ARCHITECTURE.md §3). */
export { loadClients } from './clients.repo'
export { clients } from './clients.table'
export { createVaultRoutes } from './vault.routes'
export { clientsRoutes } from './clients.routes'
export { createClient } from './create-client'
