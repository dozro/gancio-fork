import { DateTime } from 'luxon'
import { Readable } from 'node:stream'
import { IncomingMessage, ServerResponse } from 'node:http'
import { createEvent } from 'h3'
import type { IncomingHttpHeaders } from 'node:http2'
import { Socket } from 'node:net'
import type Sequelize from '@sequelize/core'
import { User } from '../../server/services/db'

type MockH3EventOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  url?: string
  query?: string | Record<string, string> | URLSearchParams | string[][] | undefined
  headers?: IncomingHttpHeaders
  params?: Record<string, string>
}

export function mockH3Event({ body = null, method = 'POST', url = '/', query = {}, headers = {}, params = {} }: MockH3EventOptions) {
  // build query string
  const qs = new URLSearchParams(query).toString()

  const req = new IncomingMessage(new Socket())
  req.method = method
  req.url = qs ? `${url}?${qs}` : url

  req.headers = { ...headers }
  if (body) {
    const json = typeof body === 'string' ? body : JSON.stringify(body)

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

export function mockInboxActivity(body: unknown) {
  return mockH3Event({
    headers: { Accept: 'application/activity+json' },
    method: 'POST',
    params: { name: 'relay' },
    body
  })
}

export async function cleanDatabase(db: Sequelize) {
  try {
    await Promise.allSettled([
      db.query(`DELETE FROM events`),
      db.query('DELETE FROM ap_users'),
      db.query('DELETE FROM events'),
      db.query('DELETE FROM event_tags'),
      db.query('DELETE FROM resources'),
      db.query('DELETE FROM instances'),
      db.query('DELETE FROM settings'),
      db.query('DELETE FROM announcements'),
      db.query('DELETE FROM oauth_tokens'),
      db.query('DELETE FROM users'),
      db.query('DELETE FROM tags'),
      db.query('DELETE FROM places'),
      db.query('DELETE FROM filters'),
      db.query('DELETE FROM collections'),
      db.query('DELETE FROM notifications'),
      db.query('DELETE FROM tasks')
    ])
  } catch (e) {
    console.error(e)
  }
}

let adminUser: User
let editorUser: User
let userUser: User
let anotherUser: User

export async function loadTestUsers() {
  if (adminUser && editorUser && userUser && anotherUser) {
    return { adminUser, editorUser, userUser, anotherUser }
  }

  let user = await User.upsert({
    email: 'admin',
    password: 'password',
    role: 'admin',
    is_active: true
  })
  adminUser = user[0]

  user = await User.upsert({
    email: 'editor',
    password: 'password',
    role: 'editor',
    is_active: true
  })
  editorUser = user[0]

  user = await User.upsert({
    email: 'user',
    password: 'password',
    role: 'user',
    is_active: true
  })
  userUser = user[0]

  user = await User.upsert({
    email: 'another',
    password: 'password',
    role: 'user',
    is_active: true
  })
  anotherUser = user[0]
  return { adminUser, editorUser, userUser, anotherUser }
}

export function now() {
  return DateTime.now().toUnixInteger()
}

export const admin = JSON.stringify({ email: 'admin', password: 'password', grant_type: 'password', client_id: 'self' })