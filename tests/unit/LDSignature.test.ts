import { describe, expect, it, vi } from 'vitest'
import { verify, sign, hashJsonLd } from '../../server/federation/ldsignature'
import { publicSettings, secretSettings } from '../../server/services'
import { connect, runMigrations } from '../../server/services/db'
import { loadSettings } from '../../server/services/settings'
import handler from '../../server/routes/federation/u/[name]/inbox.post'

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
      },
      res: {
        statusCode: 0,
        setHeader: vi.fn()
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

vi.mock('../../server/federation/helpers', async () => {
  return {
    // always return true for signature verification
    verifyHTTPSignature: vi.fn(() => ({ following: true, trusted: true })),
    // getInstance: vi.fn(),
    // getActor: vi.fn(),
  }
})

await connect()
await runMigrations()
await loadSettings()

describe('LDSignature', () => {
  it('should sign and verify a signature', async () => {
    const { default: activity } = await import('../fixtures/APActivities/0-CreateEvent')
    const hash = await hashJsonLd(activity)
    expect(hash).toBeDefined()
    expect(hash).toBe('3ca888b1affea2eab5ef5e4ba5202a02164006ec276786c6374d7dd05b6cf504')
    const signedActivity = await sign(activity, secretSettings.privateKey, 'http://localhost:13120/federation/u/relay')
    expect(signedActivity.signature).toBeDefined()
    expect(signedActivity.signature).toHaveProperty('signatureValue')
    const result = await verify(signedActivity, publicSettings.publicKey)
    expect(result).toBe(true)
  })
  
  it('should fail to verify an invalid signature', async () => {
    const { default: activity } = await import('../fixtures/APActivities/0-CreateEvent')
    const signedActivity = await sign(activity, secretSettings.privateKey, 'http://localhost:13120/federation/u/relay')
    expect(signedActivity.signature).toBeDefined()
    expect(signedActivity.signature).toHaveProperty('signatureValue')
    const result = await verify({ ...activity, signature: { ...signedActivity.signature, signatureValue: 's' + signedActivity.signature.signatureValue } }, publicSettings.publicKey)
    expect(result).toBe(false)
  })
  
  it('should verify a signed event', async () => {
    const { default: activity } = await import('../fixtures/APEvent/signed-internal-event.json')
    const signedActivity = await sign(activity, secretSettings.privateKey, 'http://localhost:13120/federation/u/relay')
    console.error(signedActivity)
    expect(signedActivity).toBeDefined()
    const result = await verify(signedActivity, publicSettings.publicKey)
    expect(result).toBe(true)
  })
  
  // it.only('should verify an incoming signed event', async () => {
  //   const { default: activity } = await import('../fixtures/APEvent/signed-event.json')
  //   const event = mockEvent({ body: activity })
  //   const result = await handler(event)
  //   expect(result).toBe(true)
  // })
  
  
})
