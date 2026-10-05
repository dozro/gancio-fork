import { describe, expect, it } from 'vitest'
import handler from '../../server/routes/feed/[format]'
import { mockH3Event } from './utils'
import { connect } from '../../server/services/db'

await connect()

describe('Export', () => {
  it('should export an rss feed', async () => {
    const evt = mockH3Event({ params: { format: 'rss' } })
    await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(evt.node.res.getHeader('content-type')).toMatch(/application\/rss\+xml/)
  })

  it('should export a json feed', async () => {
    const evt = mockH3Event({ params: { format: 'json' } })
    await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(evt.node.res.getHeader('content-type')).toMatch(/application\/json/)
  })

  it('should export an ics feed', async () => {
    const evt = mockH3Event({ params: { format: 'ics' } })
    await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(evt.node.res.getHeader('content-type')).toMatch(/text\/calendar/)
  })
})

// })