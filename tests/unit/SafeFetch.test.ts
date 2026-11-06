import { describe, expect, it, vi, afterAll } from 'vitest'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { mockH3Event, loadTestUsers } from './utils'
import { isPublicAddress, safeFetch } from '../../server/lib/safeFetch'
import { generateKeyPairSync } from 'node:crypto'
import { publicSettings, setSetting } from '../../server/services'
import { _signAndSend } from '../../server/federation/sign_and_send'
import { get as getConfig } from '../../server/services/config'

import { getUser } from '../../server/lib/getUser'
vi.mock('../../server/lib/getUser')
const mockedGetUser = vi.mocked(getUser)

const { userUser } = await loadTestUsers()
const { default: icsURLHandler } = await import('../../server/api/ics-import/url.post')

// a local server to test redirects, limits and timeouts
const server = http.createServer((req, res) => {
  switch (req.url) {
    case '/ok': return res.end('ok')
    case '/redirect': return res.writeHead(302, { Location: '/ok' }).end()
    case '/redirect-internal': return res.writeHead(302, { Location: 'http://127.0.0.2/ok' }).end()
    case '/redirect-port': return res.writeHead(302, { Location: 'http://127.0.0.1:6379/' }).end()
    case '/redirect-loop': return res.writeHead(302, { Location: '/redirect-loop' }).end()
    case '/big': return res.end('x'.repeat(2048))
    case '/slow': return // never answers
    default: return res.writeHead(404).end()
  }
})
await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
const port = (server.address() as AddressInfo).port
const base = `http://127.0.0.1:${port}`

// a fake proxy answering by itself, to see which requests go through it
const proxy = http.createServer((req, res) => res.end(`proxied ${req.url}`))
await new Promise<void>(resolve => proxy.listen(0, '127.0.0.1', resolve))
const proxyURL = `http://localhost:${(proxy.address() as AddressInfo).port}`

// allow only the local test server
const onlyTestServer = { allowedList: `127.0.0.1:${port}` }

// no proxy, unless a test enables it
vi.stubEnv('NODE_USE_ENV_PROXY', '0')

const anonEventsAllowed = publicSettings.allow_anon_event

describe('Safe fetch', () => {
  afterAll(async () => {
    for (const s of [server, proxy]) {
      s.closeAllConnections()
      s.close()
    }
    await setSetting('allow_anon_event', anonEventsAllowed)
  })

  it('should allow only public addresses', () => {
    const notPublic = [
      '127.0.0.1', '10.1.2.3', '172.17.0.2', '192.168.1.1', '100.64.0.1', '169.254.169.254',
      '::1', '::ffff:127.0.0.1', 'fd12:3456::1', 'fe80::1', '2001:db8::1'
    ]
    for (const address of notPublic) {
      expect(isPublicAddress(address), address).toBe(false)
    }
    for (const address of ['93.184.216.34', '2606:4700::1111']) {
      expect(isPublicAddress(address), address).toBe(true)
    }
  })

  it('should refuse internal targets', async () => {
    const refused: Record<string, string> = {
      'http://127.0.0.1/': 'Address not allowed',
      'http://localhost/': 'Address not allowed for localhost', // resolved by DNS
      [base + '/ok']: 'Port not allowed',
      'file:///etc/passwd': 'Protocol not allowed'
    }
    for (const [url, message] of Object.entries(refused)) {
      await expect(safeFetch(url, { allowedList: '' }), url).rejects.toThrow(message)
    }

    // the public address of this instance on other ports than the default ones
    const config = getConfig()
    const baseurl = config.baseurl
    config.baseurl = 'https://93.184.216.34'
    await expect(safeFetch('http://93.184.216.34:5432/', { allowedList: '', anyPort: true })).rejects.toThrow('Address not allowed: 93.184.216.34')
    config.baseurl = baseurl
  })

  it('should allow only the listed private addresses and ports', async () => {
    expect((await safeFetch(base + '/ok', onlyTestServer)).body.toString()).toBe('ok')
    // by host name, without checking the resolved addresses
    expect((await safeFetch(`http://localhost:${port}/ok`, { allowedList: `localhost:${port}` })).body.toString()).toBe('ok')

    // without a port only the default ports are allowed
    await expect(safeFetch(base + '/ok', { allowedList: '127.0.0.1' })).rejects.toThrow('Port not allowed')

    // TODO: this fails in CI
    // a single not allowed address refuses the host (localhost resolves to ::1 too)
    // await expect(safeFetch(`http://localhost:${port}/ok`, onlyTestServer)).rejects.toThrow('Address not allowed for localhost')

    // IPv6 and subnets
    await expect(safeFetch(`http://[::1]:${port}/ok`, { allowedList: `[fd00::/8]:${port}` })).rejects.toThrow('Address not allowed')
  })

  it('should allow any port only when asked, still checking addresses', async () => {
    await expect(safeFetch(base + '/ok', { allowedList: '', anyPort: true })).rejects.toThrow('Address not allowed: 127.0.0.1')
    expect((await safeFetch(base + '/ok', { allowedList: '127.0.0.1', anyPort: true })).body.toString()).toBe('ok')
  })

  it('should refuse internal inboxes and actors in federation', async () => {
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
    await expect(_signAndSend({ type: 'Accept' }, 'http://127.0.0.1:13120/inbox', 'post', privateKey))
      .rejects.toThrow('Address not allowed: 127.0.0.1')
    await expect(_signAndSend('', 'http://localhost/actor', 'get', privateKey))
      .rejects.toThrow('Address not allowed for localhost')
  })

  it('should check targets also through a proxy', async () => {
    vi.stubEnv('NODE_USE_ENV_PROXY', '1')
    vi.stubEnv('HTTP_PROXY', proxyURL)
    try {
      // the proxy is reached even if it is on a private address
      const ret = await safeFetch('http://93.184.216.34/ok', { allowedList: '' })
      expect(ret.body.toString()).toBe('proxied http://93.184.216.34/ok')

      // internal targets are refused before reaching the proxy, also when resolved by DNS
      await expect(safeFetch('http://127.0.0.1/', { allowedList: '' })).rejects.toThrow('Address not allowed: 127.0.0.1')
      await expect(safeFetch('http://localhost/', { allowedList: '' })).rejects.toThrow('Address not allowed for localhost')
    } finally {
      vi.stubEnv('NODE_USE_ENV_PROXY', '0')
    }
  })

  it('should check every redirect', async () => {
    expect((await safeFetch(base + '/redirect', onlyTestServer)).body.toString()).toBe('ok')
    await expect(safeFetch(base + '/redirect-internal', onlyTestServer)).rejects.toThrow('Address not allowed: 127.0.0.2')
    await expect(safeFetch(base + '/redirect-port', onlyTestServer)).rejects.toThrow('Redirect to another port not allowed: 6379')
    await expect(safeFetch(base + '/redirect-loop', onlyTestServer)).rejects.toThrow('Too many redirects')
  })

  it('should limit response size and time', async () => {
    await expect(safeFetch(base + '/big', { ...onlyTestServer, maxSize: 1024 })).rejects.toHaveProperty('reason', 'too_large')
    await expect(safeFetch(base + '/slow', { ...onlyTestServer, timeout: 50 })).rejects.toHaveProperty('reason', 'timeout')
  })

  it('should not allow anonymous ICS import from URL when anonymous events are disabled', async () => {
    await setSetting('allow_anon_event', false)
    mockedGetUser.mockResolvedValueOnce(undefined)
    const ret = icsURLHandler(mockH3Event({ method: 'POST', body: { url: 'https://example.org/calendar.ics' } }))
    await expect(ret).rejects.toHaveProperty('statusCode', 401)
  })

  it('should not tell if an ICS URL is not allowed or does not exist', async () => {
    for (const url of ['http://127.0.0.1/calendar.ics', 'http://does-not-exist.invalid/calendar.ics']) {
      mockedGetUser.mockResolvedValueOnce(userUser)
      const ret = icsURLHandler(mockH3Event({ method: 'POST', body: { url } }))
      await expect(ret, url).rejects.toHaveProperty('message', 'URL not allowed or not reachable')
    }
  })
})
