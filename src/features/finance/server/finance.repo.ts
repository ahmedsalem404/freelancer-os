import type { Database } from '@/shared/db/database'
import { asc, desc, isNull } from 'drizzle-orm'
import { expenses, ownSubscriptions } from './finance.table'

/** Snapshot slice owned by `finance`. */
export function loadFinance(db: Database) {
  return {
    expenses: db.select().from(expenses).orderBy(desc(expenses.spentOn)).all(),
    ownSubscriptions: db
      .select()
      .from(ownSubscriptions)
      .where(isNull(ownSubscriptions.cancelledOn))
      .orderBy(asc(ownSubscriptions.nextRenewalOn))
      .all(),
  }
}
