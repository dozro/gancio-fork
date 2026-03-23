import { describe, expect, it, vi } from 'vitest'
import { verifyHTTPSignature } from '../../server/federation/helpers'
import { getInstance, getActor } from '../../server/federation/lookup'
import { prepareHTTPSignature } from '../../server/federation/sign_and_send'
import { secretSettings } from '../../server/services'
import { loadSettings, publicSettings } from '../../server/services/settings'
import { connect, runMigrations } from '../../server/services/db'

function mockEvent({
  body,
  headers = {},
  params = { name: 'relay' },
  rawBody
}) {
  return {
    context: { params },
    node: {
      req: {
        headers,
        method: 'POST',
        url: '/inbox'
      }
    },
    __body: body,
    __rawBody: rawBody || JSON.stringify(body)
  }
}

vi.mock('h3', async () => {
  const actual = await vi.importActual<any>('h3')
  return {
    ...actual,
    readBody: (event) => event.__body,
    readRawBody: (event) => Buffer.from(event.__rawBody),
    getHeader: (event, name) => event.node.req.headers[name.toLowerCase()]
  }
})

vi.mock('../../server/federation/lookup', async () => {
  return {
    getInstance: vi.fn(),
    getActor: vi.fn(),
  }
})

await connect()
await runMigrations()
await loadSettings()

describe('HTTPS Signature', () => {
  it('accepts valid signature and digest', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
  
    const headers = await prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)
    console.error(headers)
    const event = mockEvent({ body, headers })
  
    getInstance.mockResolvedValue({ domain: 'a.com', blocked: false })
    getActor.mockResolvedValue({
      ap_id: body.actor,
      blocked: false,
      object: { publicKey: { publicKeyPem: publicSettings.publicKey, id: 'http://localhost:13120/federation/u/relay#main-key' } }
    })
  
    const actor = await verifyHTTPSignature(event)
    expect(actor.ap_id).toBe(body.actor)
  })
  
  it('rejects when actor is missing', async () => {
    const event = mockEvent({ body: { type: 'Create' } })
  
    await expect(verifyHTTPSignature(event))
      .rejects.toThrow('Actor not found')
  })
  
  it('rejects when instance is blocked', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
    const event = mockEvent({ body })
  
    getInstance.mockResolvedValue({ blocked: true })
  
    await expect(verifyHTTPSignature(event))
      .rejects.toThrow('Instance blocked')
  })
  
  it('rejects when actor is blocked', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
    const event = mockEvent({ body })
  
    getInstance.mockResolvedValue({ blocked: false })
    getActor.mockResolvedValue({ blocked: true })
  
    await expect(verifyHTTPSignature(event))
      .rejects.toThrow('Actor blocked')
  })
  
  it('rejects when actor has no public key', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
    const event = mockEvent({ body })
  
    getInstance.mockResolvedValue({ blocked: false })
    getActor.mockResolvedValue({ object: {} })
  
    await expect(verifyHTTPSignature(event))
      .rejects.toThrow('No public key')
  })
  
  it('rejects when digest does not match body', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
  
    const event = mockEvent({
      body,
      rawBody: JSON.stringify(body),
      headers: {
        digest: 'SHA-256=invaliddigest'
      }
    })
  
    getInstance.mockResolvedValue({ blocked: false })
    getActor.mockResolvedValue({
      object: { publicKey: { publicKeyPem: 'pubkey' } }
    })
  
    await expect(verifyHTTPSignature(event))
      .rejects.toThrow('Signature mismatch')
  })
  
})