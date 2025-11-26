import { fetch, setup } from '@nuxt/test-utils/e2e'
const base_url = 'http://localhost:13120'

await setup({ host: base_url })

export const admin = JSON.stringify({ email: 'admin', password: 'password', grant_type: 'password', client_id: 'self' })
export let cookie = '' // : string | null
let token //: string | null
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
  end_point, //: string,
  method = 'GET', //: string = 'GET',
  data, //?: any,
  authType = 'cookie', //: AuthType = 'cookie',
  contentType = 'application/json', //: 'application/json' | 'multipart/form-data' = 'application/json'
) {
  const headers = {} //: Record<string, string> = {}
  // let authHeader: string | undefined

  if (authType === 'cookie') {
    headers['cookie'] = cookie
  } else if (authType === 'jwt' && token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  let body //: string | undefined | FormData
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
    body,
  })

  try {
    response.data = await response.json()
  } catch (e) { }

  return response
}
