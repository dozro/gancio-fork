import { describe, expect, it } from 'vitest'
import { mockH3Event, cleanDatabase } from './utils'
import handler from '../../server/routes/federation/u/[name]/outbox.get'
import { connect } from '../../server/services'

const db = await connect()
await cleanDatabase(db)

describe('Outbox', () => {
  it('should return total items', async () => {
    const evt = mockH3Event({ headers: { Accept: 'application/activity+json' }, params: { name: 'relay' } })
    const ret = await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(evt.node.res.getHeader('Content-Type')).toMatch(/json/)
    expect(ret.totalItems).toBeDefined()
    expect(ret.type).toBe('OrderedCollection')
  })
})