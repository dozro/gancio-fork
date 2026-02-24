import { describe, expect, it } from 'vitest'
import { $fetch, fetch } from '@nuxt/test-utils/e2e'
import { setup } from './setup'

// const { _signAndSend } = await import('../../server/federation/sign_and_send')

await setup(false)

describe('Nodeinfo', () => {
  it('shoud return a json content', async () => {
    const { status, headers } = await fetch('/.well-known/nodeinfo')
    expect(status).toBe(200)
    expect(headers.get('content-type')).toBe('application/json')
  })

  it('shoud support nodeinfo 2.0 and 2.1', async () => {
    const res = await $fetch('/.well-known/nodeinfo')
    expect(res.links.find(l => l.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.0')?.href).toContain('/.well-known/nodeinfo/2.0')
    expect(res.links.find(l => l.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.1')?.href).toContain('/.well-known/nodeinfo/2.1')
  })

  it('shoud implement FEP-2677 - Application Actor', async () => {
    const response = await $fetch('/.well-known/nodeinfo')
    expect(response.links.find(l => l.rel === 'https://www.w3.org/ns/activitystreams#Application')?.href).toContain('/federation/u/relay')
  })
})

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

describe('AP', () => {
  it('should redirect to / on html as accepted content type', async () => {
    const res = await fetch('/federation/u/relay', { redirect: 'manual', headers: { Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8' } })
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('/')
  })

  it('should return a json when ld+json is accepted', async () => {
    const res = await fetch('/federation/u/relay', { headers: { Accept: 'application/ld+json' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/json/)
  })

  it('should return a json when activity+json is accepted', async () => {
    const res = await fetch('/federation/u/relay', { headers: { Accept: 'application/activity+json' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/json/)
  })

  it('should return the AP Actor', async () => {
    const res = await fetch('/federation/u/relay', { headers: { Accept: 'application/activity+json' } })
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toMatch(/json/)

    const data = await res.json()
    expect(data.type).toBe('Application')
    expect(data.preferredUsername).toBe('relay')
    expect(data.publicKey.publicKeyPem).toBeDefined()
  })
})

describe('Outbox', () => {
  it('should return total items', async () => {
    const res = await $fetch('/federation/u/relay/outbox', { headers: { Accept: 'application/activity+json' } })
    expect(res.type).toBe('OrderedCollection')
    expect(res.totalItems).toBeDefined()
  })
})

describe('Inbox', () => {
  it('should reject invalid actor', async () => {
    const res = await fetch('/federation/u/non_existent/inbox', {
      headers: { Accept: 'application/activity+json' },
      method: 'POST'
    })
    expect(res.status).toBe(404)
  })

  it('should reject invalid signature', async () => {
    const res = await fetch('/federation/u/relay/inbox', {
      headers: { Accept: 'application/activity+json' },
      method: 'POST'
    })
    expect(res.status).toBe(401)
  })

  it('should reject with invalid actor', async () => {
    const res = await fetch('/federation/u/relay/inbox', {
      headers: { Accept: 'application/activity+json' },
      method: 'POST',
      body: JSON.stringify({ actor: 'http://localhost:13120/federation/u/non_existent' })
    })

    expect(res.status).toBe(401)
  })

  it('should reject without private key', async () => {
    // const { _signAndSend } = await import('../server/federation/sign_and_send')
    // try {
    //   const res = await _signAndSend('', '', 'post', '')
    //   console.error(res)
    // } catch (e) {
    //   console.error(e)
    // }
    const res = await fetch('/federation/u/relay/inbox', {
      headers: { Accept: 'application/activity+json' },
      method: 'POST',
      body: JSON.stringify({ actor: 'http://localhost:13120/federation/u/relay' })
    })

    expect(res.status).toBe(401)
  })

  //   it('should follow myself', async () => {
  //     const body = {
  //       '@context': 'https://www.w3.org/ns/activitystreams',
  //       'id': `${publicSettings.baseurl}/federation/m/relay#follow`,
  //       'type': 'Follow',
  //       'actor': `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}`,
  //       'object': 'http://localhost:13120/federation/u/relay'
  //     }

  //     const ret = await signAndSend(JSON.stringify(body), 'http://localhost:13120/federation/u/relay/inbox')
  //     console.error(ret)
  //   })
})
