import { vi } from 'vitest'
import { connect } from '../server/services/db'

// notifications are not awaited and would still query the db after the tests are done,
// crashing the worker on slow runners
vi.mock('../server/services/notifier')

await connect()
