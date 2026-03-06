import { $fetchRaw as $fetch } from 'nitro-test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('Inbox', () => {
  it('should reject invalid actor', async () => {
    const { status } = await $fetch('/federation/u/non_existent/inbox', {
      headers: { Accept: 'application/activity+json' },
      method: 'POST'
    })
    expect(status).toBe(404)
  })

  it('should reject invalid signature', async () => {
    const { status } = await $fetch('/federation/u/relay/inbox', {
      headers: { Accept: 'application/activity+json' },
      method: 'POST'
    })
    expect(status).toBe(401)
  })

  it('should reject with invalid actor', async () => {
    const { status } = await $fetch('/federation/u/relay/inbox', {
      headers: { Accept: 'application/activity+json' },
      method: 'POST',
      body: JSON.stringify({ actor: 'http://localhost:13120/federation/u/non_existent' })
    })

    expect(status).toBe(401)
  })

  it('should reject without private key', async () => {
    const { status } = await $fetch('/federation/u/relay/inbox', {
      headers: { Accept: 'application/activity+json' },
      method: 'POST',
      body: JSON.stringify({ actor: 'http://localhost:13120/federation/u/relay' })
    })

    expect(status).toBe(401)
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
