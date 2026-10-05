import { describe, expect, it } from 'vitest'
import { mockH3Event } from './utils'
import { setSetting } from '../../server/services/settings'
import handler from '../../server/api/utils/ping'
import { connect } from '../../server/services/db'

await connect()

describe('API', () => {
  it('should respond with loading when nitro is not initialized', async () => {
    const evt = mockH3Event({ headers: { Accept: 'application/json' }, method: 'GET' })
    const ret = handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(ret).toBe('loading')
  })

  it('should respond with ready when status is ready', async () => {
    const evt = mockH3Event({ headers: { Accept: 'application/json' }, method: 'GET' })
    await setSetting('status', 'ready')
    const ret = handler(evt)
    expect(ret).toBe('ready')
  })
})