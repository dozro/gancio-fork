import { describe, expect, it } from 'vitest'
import { fetch } from '@nuxt/test-utils/e2e'
import { setup } from './setup'
await setup(false)

describe('Webfinger', () => {
  it('should return a 404 on bad request', async () => {
    const res = await fetch('/.well-known/webfinger')
    expect(res.status).toBe(400)
  })

  it('should return webfinger response', async () => {
    const res = await fetch('/.well-known/webfinger?resource=acct:relay@localhost:13120')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/jrd+json')
    const data = await res.json()
    expect(data?.subject).toBe('acct:relay@localhost:13120')
  })
})
