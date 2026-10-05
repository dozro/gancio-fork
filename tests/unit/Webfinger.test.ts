import { describe, expect, it } from 'vitest'
import handler from '../../server/routes/.well-known/webfinger.get'
import { mockH3Event } from './utils'

describe('Webfinger', () => {
  it('should return a 404 on bad request', async () => {
    const evt = mockH3Event({})
    const res = handler(evt)
    await expect(res).rejects.toThrow('Bad request. Please make sure "acct:USER@DOMAIN" is what you are sending as the "resource" query parameter.')
  })

  it('should return webfinger response', async () => {
    const evt = mockH3Event({
      query: { resource: 'acct:relay@localhost:13120' }
    })
    const res = await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(res?.subject).toBe('acct:relay@localhost:13120')
  })
})