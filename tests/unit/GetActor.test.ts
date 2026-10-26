import { describe, expect, it, vi, afterAll } from 'vitest'
import { generateKeyPairSync } from 'node:crypto'
import { APUser, Instance } from '../../server/services/db'
import type { APActor } from '../../server/federation/types'
import { _signAndSend } from '../../server/federation/sign_and_send'
vi.mock('../../server/federation/sign_and_send', () => ({ _signAndSend: vi.fn(), signAndSend: vi.fn() }))
const mockedSignAndSend = vi.mocked(_signAndSend)

const { getActor } = await import('../../server/federation/get_actor')
const { importActorKeys } = await import('../../server/federation/keys')

// remote documents by URL
let documents: Record<string, object | undefined> = {}
mockedSignAndSend.mockImplementation(async (_object, url) => documents[url])

const person = (id: string, name: string) => ({ id, type: 'Person', name, inbox: `${id}/inbox` })

const domains = ['trusted.example', 'evil.example', 'old.example', 'new.example']
await Instance.bulkCreate(domains.map(domain => ({ domain, name: domain, blocked: false, data: '' })))

describe('getActor', () => {
  afterAll(async () => {
    await APUser.destroy({ where: { instanceDomain: domains } })
    await Instance.destroy({ where: { domain: domains } })
  })

  it('should not trust an actor document from another origin', async () => {
    documents = {
      'https://evil.example/alice': person('https://trusted.example/users/alice', 'Fake Alice')
      // and its origin does not confirm it
    }
    expect(await getActor('https://evil.example/alice', true)).toBeUndefined()
    expect(await APUser.findByPk('https://trusted.example/users/alice')).toBeNull()
  })

  it('should use the document confirmed by the origin of its id (e.g. a moved instance)', async () => {
    documents = {
      'https://old.example/users/bob': person('https://new.example/users/bob', 'Old Bob'),
      'https://new.example/users/bob': person('https://new.example/users/bob', 'Bob')
    }
    const bob = await getActor('https://old.example/users/bob', true)
    expect(bob?.ap_id).toBe('https://new.example/users/bob')
    expect(bob?.object.name).toBe('Bob')
  })

  it('should import only keys belonging to the actor', async () => {
    const { publicKey: publicKeyPem } = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
    const carol = 'https://trusted.example/users/carol'
    await APUser.create({ ap_id: carol, object: person(carol, 'Carol') as APActor, instanceDomain: 'trusted.example' })
    const withKey = (keyId: string, owner: string) => ({ id: carol, publicKey: { id: keyId, owner, publicKeyPem } }) as APActor

    expect(await importActorKeys(withKey(`${carol}#main-key`, carol))).toHaveLength(1)
    // a key of another origin or of another owner
    expect(await importActorKeys(withKey('https://evil.example/key', carol))).toHaveLength(0)
    expect(await importActorKeys(withKey(`${carol}#other-key`, 'https://trusted.example/users/mallory'))).toHaveLength(0)
  })
})
