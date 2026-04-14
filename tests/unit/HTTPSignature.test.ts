import { describe, expect, it, vi } from 'vitest'
import { getActor } from '../../server/federation/lookup'
import { prepareHTTPSignature, verifyHTTPSignature } from '../../server/federation/httpsignature'
import { loadSettings, publicSettings, secretSettings } from '../../server/services/settings'
import { connect, runMigrations } from '../../server/services/db'
import { mockH3Event } from './utils'
import type { APActivityBase } from '../../server/federation/types'

vi.mock('../../server/federation/lookup')

const mockedGetActor = vi.mocked(getActor)

await connect()
await runMigrations()
await loadSettings()

const actor = {
  ap_id: 'https://a.com/u/test',
  blocked: false,
  object: {
    publicKey: {
      publicKeyPem: publicSettings.publicKey,
      id: 'http://localhost:13120/federation/u/relay#main-key',
      owner: 'http://localhost:13120/federation/u/relay'
    }
  }
}

describe('HTTPS Signature', () => {
  it('accepts valid signature and digest', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }

    const headers = await prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)
    const event = mockH3Event({ body, headers, url: '/inbox' })

    // mockedGetInstance.mockResolvedValue({ domain: 'a.com', blocked: false })
    mockedGetActor.mockResolvedValue({ ...actor, instance: { blocked: false } })

    const ret = await verifyHTTPSignature(event, JSON.stringify(body), body)
    expect(ret?.ap_id).toBe(body.actor)
  })

  it('rejects when signature header is missing', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
    const event = mockH3Event({ body })

    await expect(verifyHTTPSignature(event, JSON.stringify(body), body))
      .rejects.toThrow('Missing signature header')
  })

  it('rejects when keyId is missing', async () => {
    const body = { type: 'Create' }
    const event = mockH3Event({ body, headers: { signature: 'test' } })

    await expect(verifyHTTPSignature(event, JSON.stringify(body), body))
      .rejects.toThrow('keyId was not specified')
  })

  it('rejects when instance is blocked', async () => {
    const body: APActivityBase = { actor: 'https://a.com/u/test', type: 'Create' }
    const headers = await prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)
    const event = mockH3Event({ body, headers })

    mockedGetActor.mockResolvedValue({ blocked: false, instance: { blocked: true } })

    await expect(verifyHTTPSignature(event, JSON.stringify(body), body))
      .rejects.toThrow('Instance blocked')
  })

  it('rejects when actor is blocked', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
    const headers = await prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)
    const event = mockH3Event({ body, headers })

    mockedGetActor.mockResolvedValue({ blocked: true, instance: { blocked: false } })

    await expect(verifyHTTPSignature(event, JSON.stringify(body), body))
      .rejects.toThrow('Actor blocked')
  })

  it('rejects when actor has no public key', async () => {
    const body: APActivityBase = { actor: 'https://a.com/u/test', type: 'Create' }
    const headers = await prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)
    const event = mockH3Event({ body, headers })

    mockedGetActor.mockResolvedValue({ object: {}, instance: { blocked: false } })

    await expect(verifyHTTPSignature(event, JSON.stringify(body), body))
      .rejects.toThrow('No public key')
  })

  it('rejects when digest does not match body', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
    const headers = await prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)

    const event = mockH3Event({
      body,
      headers: {
        ...headers,
        digest: 'SHA-256=invaliddigest'
      }
    })

    mockedGetActor.mockResolvedValue({ ...actor, instance: { blocked: false } })

    await expect(verifyHTTPSignature(event, JSON.stringify(body), body))
      .rejects.toThrow('Signature mismatch')
  })
})