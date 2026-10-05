import { describe, expect, it } from 'vitest'
import { mockH3Event } from './utils'
import { connect } from '../../server/services/db'
import { loadSettings } from '../../server/services/settings'
import handler from '../../server/routes/.well-known/nodeinfo'

await connect()
await loadSettings()

describe('Nodeinfo', () => {
  it('shoud return a json content', async () => {
    const evt = mockH3Event({})
    const ret = await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(ret).toHaveProperty('links')
  })

  it('shoud support nodeinfo 2.0 and 2.1', async () => {
    const evt = mockH3Event({})
    const res = await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(res?.links.find(l => l.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0')?.href).toContain('/.well-known/nodeinfo/2.0')
    expect(res?.links.find(l => l.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.1')?.href).toContain('/.well-known/nodeinfo/2.1')
  })

  it('shoud implement FEP-2677 - Application Actor', async () => {
    const evt = mockH3Event({})
    const res = await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(res?.links.find(l => l.rel === 'https://www.w3.org/ns/activitystreams#Application')?.href).toContain('/federation/u/relay')
  })
})
