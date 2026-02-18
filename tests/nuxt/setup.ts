import { fetch, setup as nuxtSetup } from '@nuxt/test-utils/e2e'
import { connect, User } from '../../server/services/db'
import { DateTime } from 'luxon'

export async function setup(register = true) {
  try {
    // await nuxtSetup({ host: 'http://localhost:13120' })
    //await nuxtSetup({ host: 'http://localhost:13120' })
    await nuxtSetup({ port: 13120, browser: false, dev: true })

    const sequelize = await connect()
    try {
      await Promise.allSettled([
        sequelize.query(`DELETE FROM events`),
        sequelize.query('DELETE FROM ap_users'),
        sequelize.query('DELETE FROM events'),
        sequelize.query('DELETE FROM event_tags'),
        sequelize.query('DELETE FROM resources'),
        sequelize.query('DELETE FROM instances'),
        sequelize.query('DELETE FROM settings'),
        sequelize.query('DELETE FROM announcements'),
        sequelize.query('DELETE FROM oauth_tokens'),
        sequelize.query('DELETE FROM users'),
        sequelize.query('DELETE FROM tags'),
        sequelize.query('DELETE FROM places'),
        sequelize.query('DELETE FROM filters'),
        sequelize.query('DELETE FROM collections'),
        sequelize.query('DELETE FROM notifications'),
        sequelize.query('DELETE FROM tasks')
      ])
    } catch (e) {
      console.debug(e)
    }
    if (register) {
      await User.create({
        email: 'admin',
        password: 'password',
        role: 'admin',
        is_active: true
      })
    }
  } catch (e) {
    console.error('Nuxt setup error:', e)
  }
}

export function now() {
  return DateTime.now().toUnixInteger()
}

export const admin = JSON.stringify({ email: 'admin', password: 'password', grant_type: 'password', client_id: 'self' })
export let cookie = '' // : string | null
let token // : string | null
// let app
// let places = []
// let event_id: number

// type AuthType = 'cookie' | 'jwt' | 'none'
export function setCookie(c) {
  cookie = c
}

export function setToken(t) {
  token = t
}

export async function registerAdmin() {
  const ret = await fetch('/api/user/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: admin
  })
  console.error(ret.status)
}

export async function login() {
  const { headers } = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: admin
  })

  const cookie = headers.get('set-cookie')
  setCookie(cookie)
}

export async function fetchWithAuth(
  end_point: string, // : string,
  method = 'GET', // : string = 'GET',
  data, // ?: any,
  authType = 'cookie', // : AuthType = 'cookie',
  contentType = 'application/json' // : 'application/json' | 'multipart/form-data' = 'application/json'
) {
  const headers = {} // : Record<string, string> = {}
  // let authHeader: string | undefined

  if (authType === 'cookie') {
    if (!cookie) {
      await login()
    }
    headers['cookie'] = cookie
  } else if (authType === 'jwt' && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let body // : string | undefined | FormData
  if (data !== undefined && method !== 'GET') {
    headers['Content-Type'] = contentType
    if (contentType === 'multipart/form-data') {
      body = new FormData()
      for (const key in data) {
        body.append(key, data[key])
      }
    } else {
      body = JSON.stringify(data)
    }
  }

  const response = await fetch(end_point, {
    credentials: 'include',
    method,
    headers,
    body
  }).catch((e) => {
    response.error = e
  })

  try {
    response.data = await response.json()
  } catch (e) {
    console.error(e)
  }

  return response
}
