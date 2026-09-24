import { defineConfig } from 'drizzle-kit'

// Every feature owns its tables in src/features/<feature>/server/*.table.ts.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/features/*/server/*.table.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: { url: process.env.DB_FILE ?? 'data/freelancer-os.db' },
  strict: true,
})
