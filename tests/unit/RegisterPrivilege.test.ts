import { describe, expect, it, vi, afterAll } from 'vitest'
import { mockH3Event, cleanDatabase } from './utils'
import { connect, User } from '../../server/services'
import { enqueueMail } from '../../server/services/sendMail'

vi.mock('../../server/services/sendMail', () => ({ enqueueMail: vi.fn(), sendMail: vi.fn() }))
const mockedEnqueueMail = vi.mocked(enqueueMail)

const { default: handleRegister } = await import('../../server/api/user/register.post')
const { default: handleLogin } = await import('../../server/api/login/index.post')

type RegisterResponse = {
  id: number
  email: string
  role: string
  is_active: boolean
  password?: string
  recover_code?: string
}

const owner = { email: 'owner@example.org', password: 'password' }
const attacker = {
  email: 'attacker@example.org',
  password: 'Passw0rd!23',
  description: 'please confirm my account',
  id: 999,
  role: 'admin',
  is_active: true
}
const emails = [owner.email, attacker.email, 'leak@example.org']

function register(body: unknown) {
  return handleRegister(mockH3Event({ method: 'POST', body })) as Promise<RegisterResponse>
}

describe('Registration privilege escalation', async () => {
  const db = await connect()
  await cleanDatabase(db)

  afterAll(async () => {
    await User.destroy({ where: { email: emails } })
  })

  it('still bootstraps the first registered user as an active admin', async () => {
    const created = await register(owner)
    expect(created.role).toBe('admin')
    expect(created.is_active).toBe(true)
  })

  it('ignores role, is_active and id sent in the request body', async () => {
    const created = await register(attacker)
    expect(created.email).toBe(attacker.email)
    expect(created.role).toBe('user')
    expect(created.is_active).toBe(false)

    const stored = await User.withScope('withPassword').findByPk(created.id)
    expect(stored?.id).not.toBe(attacker.id)
    expect(stored?.role).toBe('user')
    expect(stored?.is_active).toBe(false)
    expect(stored?.password).not.toBe(attacker.password)

    expect(mockedEnqueueMail).toHaveBeenCalledWith(attacker.email, 'register', expect.anything())
  })

  it('cannot log in with the escalated credentials', async () => {
    const evt = mockH3Event({ method: 'POST', body: { email: attacker.email, password: attacker.password } })
    await expect(handleLogin(evt)).rejects.toThrow()
  })

  it('does not return the password hash to the caller', async () => {
    const created = await register({ email: 'leak@example.org', password: 'password', description: 'a description' })
    expect(created.password).toBeUndefined()
    expect(created.recover_code).toBeUndefined()
  })

  it('rejects an invalid registration body', async () => {
    await expect(register({ email: 'not-an-email', password: 'password' })).rejects.toThrow()
    await expect(register({ email: 'short@example.org', password: 'short' })).rejects.toThrow()
    expect(await User.findOne({ where: { email: 'short@example.org' } })).toBeNull()
  })
})
