import http from 'node:http'
import https from 'node:https'
import dns from 'node:dns'
import net from 'node:net'
import { get as getConfig } from '../services/config'

// fetch user supplied URLs without reaching internal services -> https://framagit.org/les/gancio/-/work_items/764

// IPv4 ranges that are not globally reachable (IANA special-purpose address registry)
const blockedIPv4 = new net.BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8], // "this network"
  ['10.0.0.0', 8], // private
  ['100.64.0.0', 10], // shared address space, used by CGNAT, VPNs and container networks
  ['127.0.0.0', 8], // loopback
  ['169.254.0.0', 16], // link-local, cloud metadata endpoints
  ['172.16.0.0', 12], // private, docker default networks
  ['192.0.0.0', 24], // IETF protocol assignments
  ['192.0.2.0', 24], // documentation
  ['192.88.99.0', 24], // 6to4 relay anycast
  ['192.168.0.0', 16], // private
  ['198.18.0.0', 15], // benchmarking
  ['198.51.100.0', 24], // documentation
  ['203.0.113.0', 24], // documentation
  ['224.0.0.0', 4], // multicast
  ['240.0.0.0', 4] // reserved and broadcast
] as const) {
  blockedIPv4.addSubnet(address, prefix, 'ipv4')
}

// only global unicast IPv6 is allowed (2000::/3) without its special-purpose ranges,
// this excludes loopback, link-local, unique local (fc00::/7) and IPv4-mapped addresses
const globalIPv6 = new net.BlockList()
globalIPv6.addSubnet('2000::', 3, 'ipv6')
const blockedIPv6 = new net.BlockList()
for (const [address, prefix] of [
  ['2001::', 23], // IETF protocol assignments (Teredo, ...)
  ['2001:db8::', 32], // documentation
  ['2002::', 16], // 6to4, embeds IPv4 addresses
  ['3fff::', 20] // documentation
] as const) {
  blockedIPv6.addSubnet(address, prefix, 'ipv6')
}

/** true if the IP address is globally reachable */
export function isPublicAddress(address: string) {
  switch (net.isIP(address)) {
    case 4: return !blockedIPv4.check(address, 'ipv4')
    case 6: return globalIPv6.check(address, 'ipv6') && !blockedIPv6.check(address, 'ipv6')
    default: return false
  }
}

/**
 * The addresses of this instance (`baseurl`): requests to them never leave the machine, so services listening there
 * (e.g. the Portainer API) could be reachable even if a firewall protects them from outside.
 * They are allowed only on the default ports, served by the instance itself (e.g. to import an image of its own events).
 */
async function getOwnAddresses() {
  const host = new URL(getConfig().baseurl).hostname.replace(/^\[(.*)\]$/, '$1')
  const addresses = await dns.promises.lookup(host, { all: true }).catch(() => [])
  return addresses.map(a => a.address)
}

/**
 * - `invalid_url`: invalid URL, protocol or port, depends only on the URL
 * - `unreachable`: not allowed, not resolvable or connection failed. These are intentionally not distinguished:
 *    "not allowed" vs "not resolvable" would tell which internal host names exist (e.g. `db` in a container network)
 * - `too_large`, `timeout`, `status`: can only happen with allowed targets, so they are safe to tell
 */
export type SafeFetchErrorReason = 'invalid_url' | 'unreachable' | 'too_large' | 'timeout' | 'too_many_redirects' | 'status'

export class SafeFetchError extends Error {
  reason: SafeFetchErrorReason
  /** response status for `status`, size limit in bytes for `too_large` */
  value?: number

  constructor(message: string, reason: SafeFetchErrorReason, value?: number) {
    super(message)
    this.reason = reason
    this.value = value
  }
}

/** a message that can be shown to users: it does not tell anything about internal networks */
export function describeSafeFetchError(e: SafeFetchError) {
  switch (e.reason) {
    case 'invalid_url': return 'Invalid URL'
    case 'unreachable': return 'URL not allowed or not reachable'
    case 'too_large': return `File too large (max ${Math.round((e.value ?? 0) / 1024 / 1024)} MB)`
    case 'timeout': return 'Timeout'
    case 'too_many_redirects': return 'Too many redirects'
    case 'status': return `The server responded with status ${e.value}`
  }
}

/** throws a `SafeFetchError` if the response status is not 2xx */
export function ensureOk(response: SafeFetchResponse) {
  if (response.status < 200 || response.status >= 300) {
    throw new SafeFetchError(`Status ${response.status}`, 'status', response.status)
  }
  return response
}

type AllowedEntry = { host?: string, subnet?: net.BlockList, port?: string }

/**
 * Parse a comma separated list of exceptions to the public address check:
 * host names, IP addresses or subnets with an optional port, IPv6 in brackets
 * e.g. `localhost:13120,192.168.1.0/24,[fd00::1]:8080,[fd00::/8]`
 */
export function parseAllowedList(list: string): AllowedEntry[] {
  return list.split(',').map(e => e.trim()).filter(Boolean).map((entry) => {
    let target = entry
    let port: string | undefined
    const bracketed = /^\[(.+)\](?::(\d+))?$/.exec(entry)
    if (bracketed) {
      target = bracketed[1]!
      port = bracketed[2]
    } else {
      const withPort = /^(.+):(\d+)$/.exec(entry)
      if (withPort) {
        target = withPort[1]!
        port = withPort[2]
      }
    }

    const [address, prefix] = target.split('/')
    const family = net.isIP(address ?? '')
    if (!family) {
      return { host: target.toLowerCase(), port }
    }
    const subnet = new net.BlockList()
    const type = family === 4 ? 'ipv4' : 'ipv6'
    if (prefix) {
      subnet.addSubnet(address!, Number(prefix), type)
    } else {
      subnet.addAddress(address!, type)
    }
    return { subnet, port }
  })
}

export type SafeFetchOptions = {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string
  /** maximum response size in bytes */
  maxSize?: number
  /** overall timeout in milliseconds, redirects included */
  timeout?: number
  maxRedirects?: number
  /** exceptions to the public address check, by default from `GANCIO_ALLOWED_PRIVATE_ADDRESSES` */
  allowedList?: string
  /** allow any port (e.g. federation), by default only the default ports */
  anyPort?: boolean
}

type Policy = { allowed: AllowedEntry[], anyPort: boolean, ownAddresses: string[] }

export type SafeFetchResponse = {
  status: number
  headers: http.IncomingHttpHeaders
  body: Buffer
}

// as node does for its global agents (built-in proxy support), our own agents use the proxy from the environment
function useEnvProxy() {
  return process.env.NODE_USE_ENV_PROXY === '1' || process.execArgv.includes('--use-env-proxy')
}

function effectivePort(url: URL) {
  return url.port || (url.protocol === 'https:' ? '443' : '80')
}

// `port` is empty for the default port of the protocol
function isAllowedPort(url: URL, policy: Policy) {
  return policy.anyPort || url.port === ''
}

// an exception lifts the address check, and the port check too only for the port it specifies
function isAllowedPortFor(entry: AllowedEntry, url: URL, policy: Policy) {
  return entry.port ? entry.port === effectivePort(url) : isAllowedPort(url, policy)
}

// host names listed as exception skip the address check (e.g. split DNS)
function isAllowedHost(url: URL, policy: Policy) {
  return policy.allowed.some(e => e.host === url.hostname.toLowerCase() && isAllowedPortFor(e, url, policy))
}

function isAllowedTarget(address: string, url: URL, policy: Policy) {
  const type = net.isIP(address) === 4 ? 'ipv4' : 'ipv6'
  if (policy.allowed.some(e => e.subnet?.check(address, type) && isAllowedPortFor(e, url, policy))) {
    return true
  }
  const isOwnAddressOnOtherPort = url.port !== '' && policy.ownAddresses.includes(address)
  return isAllowedPort(url, policy) && isPublicAddress(address) && !isOwnAddressOnOtherPort
}

/**
 * Fetch a URL that could point anywhere (user supplied or coming from the federation).
 * Each resolved address is checked when connecting, so redirects and DNS rebinding cannot reach
 * internal services. Throws a `SafeFetchError` on any failure, the status is not checked (see `ensureOk`).
 */
export async function safeFetch(input: string, options: SafeFetchOptions = {}): Promise<SafeFetchResponse> {
  const {
    maxSize = 5 * 1024 * 1024,
    timeout = 10000,
    maxRedirects = 3
  } = options
  const policy: Policy = {
    allowed: parseAllowedList(options.allowedList ?? getConfig().allowed_private_addresses ?? ''),
    anyPort: options.anyPort ?? false,
    // needed only when other ports than the default ones are allowed
    ownAddresses: options.anyPort ? await getOwnAddresses() : []
  }

  const deadline = Date.now() + timeout
  let method = options.method ?? 'GET'
  let body = options.body
  let url = parseURL(input)
  const headers = new Headers(options.headers)
  headers.delete('host')
  for (let redirects = 0; ; redirects++) {
    checkURL(url, policy)
    if (useEnvProxy()) {
      await checkProxiedTarget(url, policy)
    }
    const response = await request(url, { method, headers, body, maxSize, deadline, policy })
    const location = response.headers.location
    if (response.status < 300 || response.status >= 400 || !location) {
      return response
    }

    if (redirects >= maxRedirects) {
      throw new SafeFetchError('Too many redirects', 'too_many_redirects')
    }
    const next = parseURL(location, url)
    // a redirect can keep the port or use the default one of its protocol (e.g. http -> https)
    if (next.port && effectivePort(next) !== effectivePort(url)) {
      throw new SafeFetchError(`Redirect to another port not allowed: ${next.port}`, 'unreachable')
    }
    // credentials and signatures belong to the origin they were made for (as fetch does)
    if (next.origin !== url.origin) {
      for (const name of ['authorization', 'cookie', 'signature', 'digest']) {
        headers.delete(name)
      }
    }
    url = next
    // as fetch does, 303 (and 301/302 after a POST) are followed with a GET without body
    if (response.status === 303 || (method === 'POST' && [301, 302].includes(response.status))) {
      method = 'GET'
      body = undefined
    }
  }
}

function parseURL(input: string, base?: URL) {
  try {
    return new URL(input, base)
  } catch {
    throw new SafeFetchError('Invalid URL', 'invalid_url')
  }
}

function checkURL(url: URL, policy: Policy) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new SafeFetchError(`Protocol not allowed: ${url.protocol}`, 'invalid_url')
  }
  if (isAllowedHost(url, policy)) return
  if (!isAllowedPort(url, policy) && !policy.allowed.some(e => e.port === url.port)) {
    throw new SafeFetchError(`Port not allowed: ${url.port}`, 'invalid_url')
  }
  // IP literals are not resolved, so the lookup below does not check them
  const host = url.hostname.replace(/^\[(.*)\]$/, '$1')
  if (net.isIP(host) && !isAllowedTarget(host, url, policy)) {
    throw new SafeFetchError(`Address not allowed: ${host}`, 'unreachable')
  }
}

// through a proxy our lookup is not used: run it before, except for onion addresses that only Tor resolves
function checkProxiedTarget(url: URL, policy: Policy) {
  if (url.hostname.endsWith('.onion') && getConfig().hidden_service === 'true') return
  const host = url.hostname.replace(/^\[(.*)\]$/, '$1')
  return new Promise<void>((resolve, reject) => createLookup(url, policy)(host, { all: true }, err =>
    err ? reject(err instanceof SafeFetchError ? err : new SafeFetchError(err.message, 'unreachable')) : resolve()))
}

// resolve the hostname and refuse the connection if any of its addresses is not allowed
function createLookup(url: URL, policy: Policy): net.LookupFunction {
  const allowAll = isAllowedHost(url, policy)
  return (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) {
        return callback(err, '', 0)
      }
      if (!addresses.length || (!allowAll && addresses.some(a => !isAllowedTarget(a.address, url, policy)))) {
        return callback(new SafeFetchError(`Address not allowed for ${hostname}`, 'unreachable'), '', 0)
      }
      if (options.all) {
        return callback(null, addresses)
      }
      callback(null, addresses[0]!.address, addresses[0]!.family)
    })
  }
}

type RequestOptions = {
  method: 'GET' | 'POST'
  headers?: Headers
  body?: string
  maxSize: number
  deadline: number
  policy: Policy
}

function request(url: URL, opts: RequestOptions): Promise<SafeFetchResponse> {
  return new Promise((resolve, reject) => {
    const remaining = opts.deadline - Date.now()
    if (remaining <= 0) {
      return reject(new SafeFetchError('Timeout', 'timeout'))
    }

    // any other error (DNS, connection, TLS) is reported as unreachable
    const fail = (e: Error) => {
      clearTimeout(timer)
      reject(e instanceof SafeFetchError ? e : new SafeFetchError(e.message, 'unreachable'))
    }
    const headers = new Headers(opts.headers)
    headers.set('User-Agent', `Gancio`)
    if (opts.body !== undefined) {
      headers.set('Content-Length', String(Buffer.byteLength(opts.body)))
    }
    const req = (url.protocol === 'https:' ? https : http).request(url, {
      method: opts.method,
      headers: Object.fromEntries(headers),
      lookup: createLookup(url, opts.policy),
      // not the global agent: its pooled connections could have been opened without our address check
      agent: new (url.protocol === 'https:' ? https.Agent : http.Agent)({ proxyEnv: useEnvProxy() ? process.env : undefined })
    }, (res) => {
      const tooLarge = new SafeFetchError('Response too large', 'too_large', opts.maxSize)
      if (Number(res.headers['content-length']) > opts.maxSize) {
        req.destroy(tooLarge)
        return
      }

      const chunks: Buffer[] = []
      let size = 0
      res.on('data', (chunk: Buffer) => {
        size += chunk.length
        if (size > opts.maxSize) {
          req.destroy(tooLarge)
          return
        }
        chunks.push(chunk)
      })
      res.on('end', () => {
        clearTimeout(timer)
        resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) })
      })
      res.on('error', fail)
    })

    const timer = setTimeout(() => req.destroy(new SafeFetchError('Timeout', 'timeout')), remaining)
    req.on('error', fail)

    if (opts.body !== undefined) {
      req.write(opts.body)
    }
    req.end()
  })
}
