import { describe, expect, it } from 'vitest'
import { mockH3Event } from './utils'
import handler from '../../server/routes/federation/u/[name]/index.get'

describe('AP', () => {
  it('should redirect to / on html as accepted content type', async () => {
    const evt = mockH3Event({
      headers: { accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' },
      params: { name: 'relay' }
    })
    await handler(evt)
    expect(evt.node.res.statusCode).toBe(302)
    expect(evt.node.res.getHeader('Location')).toBe('/')
  })

  it('should return a json when ld+json is accepted', async () => {
    const evt = mockH3Event({
      headers: { accept: 'application/ld+json' },
      params: { name: 'relay' }
    })
    await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(evt.node.res.getHeader('content-type')).toMatch(/json/)
  })

  it('should return a json when activity+json is accepted', async () => {
    const evt = mockH3Event({
      headers: { accept: 'application/activity+json' },
      params: { name: 'relay' }
    })
    await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(evt.node.res.getHeader('content-type')).toMatch(/json/)
  })

  it('should return the AP Actor', async () => {
    const evt = mockH3Event({
      headers: { accept: 'application/activity+json' },
      params: { name: 'relay' }
    })
    const ret = await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(evt.node.res.getHeader('content-type')).toMatch(/json/)

    expect(ret?.type).toBe('Application')
    expect(ret?.preferredUsername).toBe('relay')
  })
})
