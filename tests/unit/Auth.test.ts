import { describe, expect, it } from 'vitest'
import { mockH3Event, cleanDatabase } from './utils'
import { connect } from '../../server/services'

// registration validates the e-mail format, so the login-only `admin` shortcut cannot be used here
const admin = JSON.stringify({ email: 'admin@example.org', password: 'password' })
const wrong_credentials = JSON.stringify({ email: 'admin@example.org', password: 'wrong' })

let cookie: string | undefined
let token: string | undefined

const { default: handlerUser } = await import('../../server/api/user/index.get')
const { default: handleLogin } = await import('../../server/api/login/index.post')
const { default: handleLoginToken } = await import('../../server/api/login/token.post')
const { default: handleRegister } = await import('../../server/api/user/register.post')

describe('Authentication / Authorization', async () => {
  const db = await connect()
  await cleanDatabase(db)
  it('should not return an user when not authenticated', async () => {
    const evt = mockH3Event({ headers: { cookie: '' } })
    const ret = handlerUser(evt)
    await expect(ret).rejects.toThrow()
  })

  it('should not authenticate with wrong user/password', async () => {
    const evt = mockH3Event({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: 'wrong' })
    })
    const ret = handleLogin(evt)
    await expect(ret).rejects.toThrow()
  })

  it('should register an admin as first user', async () => {
    const evt = mockH3Event({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: admin
    })
    const user = await handleRegister(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(user?.id).toBeDefined()
  })

  it('should authenticate with correct user/password', async () => {
    const evt = mockH3Event({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: admin
    })
    const user = await handleLogin(evt)
    expect(evt.node.res.statusCode).toBe(200)
    cookie = evt.node.res.getHeader('set-cookie') as string
    expect(cookie).toContain('nuxt-session=')
    expect(user).toBeDefined()
  })

  it('should get user when authenticated via cookie', async () => {
    const evt = mockH3Event({ headers: { cookie: cookie! } })
    const user = await handlerUser(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(user?.email).toBe('admin@example.org')
  })

  it('should not authenticate with wrong user/password', async () => {
    const evt = mockH3Event({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: wrong_credentials
    })

    const ret = handleLoginToken(evt)
    await expect(ret).rejects.toThrow()
  })

  it('should authenticate with correct user/password and get JWT token', async () => {
    const evt = mockH3Event({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: admin
    })
    const data = await handleLoginToken(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(data?.access_token).toBeDefined()
    expect(typeof data.access_token).toBe('string')
    token = data.access_token
  })

  it('should get user when authenticated via JWT', async () => {
    const evt = mockH3Event({ headers: { authorization: `Bearer ${token}` } })
    const user = await handlerUser(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(user?.email).toBe('admin@example.org')
    expect(user?.role).toBe('admin')
  })

  it('should not get user when authenticated via wrong JWT', async () => {
    const evt = mockH3Event({ headers: { authorization: `Bearer a${token}` } })
    const ret = handlerUser(evt)
    await expect(ret).rejects.toThrow()
  })
})