import { vi } from 'vitest'
import { DateTime } from 'luxon'
import { Readable } from 'node:stream'
import { IncomingMessage, ServerResponse } from 'node:http'
import { createEvent } from 'h3'
import type { IncomingHttpHeaders } from 'node:http2'

type MockH3EventOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  url?: string
  query?: string | Record<string, string> | URLSearchParams | string[][] | undefined
  headers?: IncomingHttpHeaders
  params?: Record<string, string>
}

export function mockH3Event({ body = null, method = 'POST', url = '/', query = {}, headers = {}, params = {} }: MockH3EventOptions) {
  // build query string
  const qs = new URLSearchParams(query).toString()

  const req = new IncomingMessage(null as any)
  req.method = method
  req.url = qs ? `${url}?${qs}` : url

  req.headers = { ...headers }
  if (body) {
    const json = JSON.stringify(body)

    // simulate request stream
    const stream = Readable.from([Buffer.from(json)])
    Object.assign(req, stream)

    req.headers['content-type'] = req.headers['content-type'] || 'application/json'
    req.headers['content-length'] = Buffer.byteLength(json).toString()
  }

  const res = new ServerResponse(req)
  const evt = createEvent(req, res)
  evt.context.params = { ...params }
  return evt
}

export function mockInboxActivity(body: any) {
  return mockH3Event({
    headers: { Accept: 'application/activity+json' },
    method: 'POST',
    params: { name: 'relay' },
    body
  })
}

export function now() {
  return DateTime.now().toUnixInteger()
}
