import { connect, runMigrations } from '../server/services/db'
import { loadSettings } from '../server/services'
import { cleanDatabase } from './unit/utils'

export async function setup() {
  console.error('dentro before all della suite')
  const db = await connect()
  await runMigrations()
  await cleanDatabase(db)
  await loadSettings()
  await db.close()
}