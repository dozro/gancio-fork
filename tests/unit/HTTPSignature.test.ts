import { describe, expect, it, vi } from 'vitest'
import { getActor } from '../../server/federation/get_actor'
import { prepareHTTPSignature, verifyHTTPSignature } from '../../server/federation/httpsignature'
import { loadSettings, publicSettings, secretSettings } from '../../server/services/settings'
import { connect, runMigrations } from '../../server/services/db'
import { decodeStructuredField, encodeStructuredField } from '../../server/federation/http_dict'
import { mockH3Event } from './utils'
import { parseHttpKeyValueHeader } from '../../server/lib/http'
// import type { APActivityBase } from '../../server/federation/types'

vi.mock('../../server/federation/get_actor')

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
  it('should parse HTTP key/value header', () => {
    expect(parseHttpKeyValueHeader('')).toEqual(new Map([]))
    expect(parseHttpKeyValueHeader('key=value')).toEqual(new Map([['key', 'value']]))
    expect(parseHttpKeyValueHeader('a=b,c=d,e=,=fff')).toEqual(new Map([
      ['a', 'b'],
      ['c', 'd'],
      ['e', ''],
      ['', 'fff']
    ]))

    expect(parseHttpKeyValueHeader(`key="value",name="a=b",other="c,d,e=f,g"`)).toEqual(new Map([
      ['key', 'value'],
      ['name', 'a=b'],
      ['other', 'c,d,e=f,g']
    ]))

    const REAL = `keyId="${actor.object.publicKey.id}",algorithm="rsa-sha256",headers="(request-target) host date digest content-type",signature="CoqTCV+UnsFSdzAt64tg/K9+ySq3pZMAHajzYuA43C/ICK4WqARUbPpEbf83+7OB/G77SYA/Qr27GeG5a3+3wIRjuDXe5ZR9R0b2/O0GPWpF8NE8owLLf1NrtQh1wILPkAr/15OITXnoDraKkDPohVHfFeF9rsJmfMC/fv6LQBLwL36wGqJlPI1WeL1M+steZGRp92lTfjFlxYgO+Lv5kigSn5BWgV+q5sIGG79kEgHKSy17Ftoaic378xMri+IOvTKQKXTPuimWqyHm4aWL/t7EeyZFllbIXEkQA8H1nwZVK5Y6/hazpJfhB1RiEAbHy5rKCz+RYC+sv3pgAVHQEw=="`
    expect(parseHttpKeyValueHeader(REAL)).toEqual(new Map([
      ['keyId', actor.object.publicKey.id],
      ['algorithm', 'rsa-sha256'],
      ['headers', '(request-target) host date digest content-type'],
      ['signature', 'CoqTCV+UnsFSdzAt64tg/K9+ySq3pZMAHajzYuA43C/ICK4WqARUbPpEbf83+7OB/G77SYA/Qr27GeG5a3+3wIRjuDXe5ZR9R0b2/O0GPWpF8NE8owLLf1NrtQh1wILPkAr/15OITXnoDraKkDPohVHfFeF9rsJmfMC/fv6LQBLwL36wGqJlPI1WeL1M+steZGRp92lTfjFlxYgO+Lv5kigSn5BWgV+q5sIGG79kEgHKSy17Ftoaic378xMri+IOvTKQKXTPuimWqyHm4aWL/t7EeyZFllbIXEkQA8H1nwZVK5Y6/hazpJfhB1RiEAbHy5rKCz+RYC+sv3pgAVHQEw==']
    ]))
  })

  it('should accepts valid signature and digest', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' as const }

    const headers = prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)
    const event = mockH3Event({ body, headers, url: '/inbox' })

    // mockedGetInstance.mockResolvedValue({ domain: 'a.com', blocked: false })
    mockedGetActor.mockResolvedValue({ ...actor, instance: { blocked: false } })

    const ret = await verifyHTTPSignature(event, JSON.stringify(body))
    expect(ret?.ap_id).toBe(body.actor)
  })

  it('should rejects when signature header is missing', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' as const }
    const event = mockH3Event({ body })

    await expect(verifyHTTPSignature(event, JSON.stringify(body)))
      .rejects.toThrow('Missing signature header')
  })

  it('should rejects when date header is missing', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' as const }
    const headers = { signature: 'test' }
    const event = mockH3Event({ body, headers })

    await expect(verifyHTTPSignature(event, JSON.stringify(body)))
      .rejects.toThrow('Missing date header')
  })

  it('rejects when keyId is missing', async () => {
    const body = { type: 'Create' as const }
    const event = mockH3Event({ body, headers: { signature: 'test', date: new Date().toUTCString() } })

    await expect(verifyHTTPSignature(event, JSON.stringify(body)))
      .rejects.toThrow('Missing keyId in signature header')
  })

  // it('rejects when instance is blocked', async () => {
  //   const body: APActivityBase = { actor: 'https://a.com/u/test', type: 'Create' as const }
  //   const headers = await prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)
  //   const event = mockH3Event({ body, headers })

  //   mockedGetActor.mockResolvedValue({ blocked: false, instance: { blocked: true } })

  //   await expect(verifyHTTPSignature(event, JSON.stringify(body), body))
  //     .rejects.toThrow('Instance blocked')
  // })

  // it('rejects when actor is blocked', async () => {
  //   const body: APActivityBase = { actor: 'https://a.com/u/test', type: 'Create' as const }
  //   const headers = await prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)
  //   const event = mockH3Event({ body, headers })

  //   mockedGetActor.mockResolvedValue({ blocked: true, instance: { blocked: false } })

  //   await expect(verifyHTTPSignature(event, JSON.stringify(body), body))
  //     .rejects.toThrow('Actor blocked')
  // })

  it('should rejects when actor has no public key', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
    const headers = prepareHTTPSignature(JSON.stringify(body),
      'https://a.com/inbox', 'post', secretSettings.privateKey, actor.object.publicKey.id.replace('#main-key', '#missing-key'))
    const event = mockH3Event({ body, headers })

    mockedGetActor.mockResolvedValue({ object: {}, instance: { blocked: false } })

    await expect(verifyHTTPSignature(event, JSON.stringify(body)))
      .rejects.toThrow('Signing actor has no public key http://localhost:13120/federation/u/relay#missing-key')
  })

  it('should rejects when digest does not match body', async () => {
    const body = { actor: 'https://a.com/u/test', type: 'Create' }
    const headers = prepareHTTPSignature(JSON.stringify(body), 'https://a.com/inbox', 'post', secretSettings.privateKey)

    const event = mockH3Event({
      body,
      headers: {
        ...headers,
        digest: 'SHA-256=invaliddigest'
      }
    })

    mockedGetActor.mockResolvedValue({ ...actor, instance: { blocked: false } })

    await expect(verifyHTTPSignature(event, JSON.stringify(body)))
      .rejects.toThrow('Signature mismatch')
  })
})

describe('RFC 9421 Signature', () => {
  it('encode/decode structured field', () => {
    const v1 = decodeStructuredField(`en="Applepie", da=:w4ZibGV0w6ZydGU=:`)
    expect([...v1.keys()]).toEqual(['en', 'da'])
    expect(v1.get('en')!.value).toEqual('Applepie')
    expect(Buffer.from(v1.get('da')!.value as Uint8Array).toString('hex')).toEqual('c386626c6574c3a6727465')
    expect(encodeStructuredField(v1)).toEqual(`en="Applepie", da=:w4ZibGV0w6ZydGU=:`)

    const v2 = decodeStructuredField(`a=?0, b, c; foo=bar`)
    expect([...v2.keys()]).toEqual(['a', 'b', 'c'])
    expect(v2.get('a')!.value).toEqual(false)
    expect(v2.get('b')!.value).toEqual(true)
    expect(v2.get('c')!.value).toEqual(true)
    expect([...v2.get('c')!.params!.keys()]).toEqual(['foo'])
    expect(v2.get('c')!.params!.get('foo')).toEqual('bar')
    expect(encodeStructuredField(v2)).toEqual(`a=?0, b=?1, c=?1;foo="bar"`)

    const v3 = decodeStructuredField(`rating=1.5, feelings=(joy sadness)`)
    expect([...v3.keys()]).toEqual(['rating', 'feelings'])
    expect(v3.get('rating')!.value).toEqual(1.5)
    expect(v3.get('feelings')!.value).toEqual(['joy', 'sadness'])
    expect(encodeStructuredField(v3)).toEqual(`rating=1.5, feelings=("joy" "sadness")`)

    const v4 = decodeStructuredField(`a=(1 2), b=3, c=4;aa=bb, d=(5 6);valid`)
    expect([...v4.keys()]).toEqual(['a', 'b', 'c', 'd'])
    expect(v4.get('a')!.value).toEqual([1, 2])
    expect(v4.get('b')!.value).toEqual(3)
    expect(v4.get('c')!.value).toEqual(4)
    expect([...v4.get('c')!.params!.keys()]).toEqual(['aa'])
    expect(v4.get('c')!.params!.get('aa')).toEqual('bb')
    expect(v4.get('d')!.value).toEqual([5, 6])
    expect([...v4.get('d')!.params!.keys()]).toEqual(['valid'])
    expect(v4.get('d')!.params!.get('valid')).toEqual(true)
    expect(encodeStructuredField(v4)).toEqual(`a=(1 2), b=3, c=4;aa="bb", d=(5 6);valid`)
  })
})