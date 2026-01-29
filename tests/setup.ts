import { fetch, setup as nuxtSetup } from '@nuxt/test-utils/e2e'
import { connect } from '../server/services/db'
import { DateTime } from 'luxon'

export async function setup(register = true) {
  try {
    await nuxtSetup({ host: 'http://localhost:13120' })
    const sequelize = await connect()
    // await sequelize.query(`DELETE FROM ${col('user_followers')}`)
    await sequelize.query(`DELETE FROM events`)
    await sequelize.query('DELETE FROM ap_users')
    await sequelize.query('DELETE FROM events')
    await sequelize.query('DELETE FROM event_tags')
    await sequelize.query('DELETE FROM resources')
    await sequelize.query('DELETE FROM instances')
    await sequelize.query('DELETE FROM settings')
    await sequelize.query('DELETE FROM announcements')
    await sequelize.query('DELETE FROM oauth_tokens')
    await sequelize.query('DELETE FROM users')
    await sequelize.query('DELETE FROM tags')
    await sequelize.query('DELETE FROM places')
    await sequelize.query('DELETE FROM filters')
    await sequelize.query('DELETE FROM collections')
    await sequelize.query('DELETE FROM notifications')
    await sequelize.query('DELETE FROM tasks')
    if (register) {
      await registerAdmin()
      await login()
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
  await fetch('/api/user/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: admin
  })
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
