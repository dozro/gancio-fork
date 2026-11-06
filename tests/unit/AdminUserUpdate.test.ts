import { describe, expect, it, vi, afterAll } from 'vitest'
import bcrypt from 'bcryptjs'
import { mockH3Event, cleanDatabase } from './utils'
import { connect, User } from '../../server/services'

vi.mock('../../server/services/sendMail', () => ({ enqueueMail: vi.fn(), sendMail: vi.fn() }))

const { default: handleLogin } = await import('../../server/api/login/index.post')
const { default: handleUpdate } = await import('../../server/api/user/[id].put')

const adminAccount = { email: 'admin@example.org', password: 'password' }
const memberAccount = { email: 'member@example.org', password: 'Passw0rd!' }

type UserJson = {
  id: number
  email: string
  role: string
  is_active: boolean
  to_notify: boolean
  description: string | null
  password?: string
  recover_code?: string
}

let adminCookie: string
let member: UserJson

async function login (account: { email: string, password: string }) {
  const evt = mockH3Event({ method: 'POST', body: account })
  await handleLogin(evt)
  return evt.node.res.getHeader('set-cookie') as string
}

function editAsAdmin (body: Record<string, unknown>) {
  return handleUpdate(mockH3Event({
    method: 'PUT',
    params: { id: String(member.id) },
    headers: { cookie: adminCookie },
    body
  })) as Promise<UserJson>
}

/** what the Admin -> Users edit dialog posts: the whole user object read back from
 * /api/users, plus the "new password" field that was left blank */
function dialogPayload (overrides: Record<string, unknown> = {}) {
  return {
    id: member.id,
    email: member.email,
    role: member.role,
    is_active: member.is_active,
    to_notify: member.to_notify,
    description: member.description,
    password: '',
    createdAt: '2026-11-06T09:00:00.000Z',
    updatedAt: '2026-11-06T09:00:00.000Z',
    ...overrides
  }
}

async function storedHash () {
  const row = await User.withScope('withPassword').findByPk(member.id)
  return row?.password
}

describe('Admin user update', async () => {
  const db = await connect()
  await cleanDatabase(db)

  await User.create({ ...adminAccount, role: 'admin', is_active: true })
  const created = await User.create({
    ...memberAccount,
    role: 'user',
    is_active: true,
    description: 'registered from the login page'
  })
  member = created.get({ plain: true }) as unknown as UserJson
  adminCookie = await login(adminAccount)

  afterAll(async () => {
    await User.destroy({ where: { email: [adminAccount.email, memberAccount.email] } })
  })

  it('keeps the stored hash when the dialog posts an empty password', async () => {
    const before = await storedHash()

    await editAsAdmin(dialogPayload())

    const after = await storedHash()
    expect(after).toBeTruthy()
    expect(after).toBe(before)
    expect(await bcrypt.compare(memberAccount.password, after!)).toBe(true)
  })

  it('still logs in with the old password after an edit that changes nothing', async () => {
    await editAsAdmin(dialogPayload())

    const evt = mockH3Event({ method: 'POST', body: memberAccount })
    await expect(handleLogin(evt)).resolves.toMatchObject({
      email: memberAccount.email,
      role: 'user'
    })
  })

  it('still updates the fields an administrator is allowed to change', async () => {
    const updated = await editAsAdmin(dialogPayload({ role: 'editor', to_notify: true }))

    expect(updated.role).toBe('editor')
    expect(updated.to_notify).toBe(true)
    expect(updated.description).toBe('registered from the login page')
  })

  it('changes the password when the dialog posts a new one', async () => {
    const before = await storedHash()
    const newPassword = 'AnotherPassw0rd!'

    await editAsAdmin(dialogPayload({ password: newPassword }))

    const after = await storedHash()
    expect(after).not.toBe(before)
    expect(await bcrypt.compare(newPassword, after!)).toBe(true)

    const stale = mockH3Event({ method: 'POST', body: memberAccount })
    await expect(handleLogin(stale)).rejects.toThrow()
  })

  it('rejects a new password shorter than the registration minimum', async () => {
    const before = await storedHash()

    await expect(editAsAdmin(dialogPayload({ password: 'short' }))).rejects.toThrow()

    expect(await storedHash()).toBe(before)
  })

  it('ignores fields that are not editable, such as id and recover_code', async () => {
    await editAsAdmin(dialogPayload({ id: 999, recover_code: 'deadbeef', email: 'evil@example.org' }))

    const stored = await User.withScope('withPassword').findByPk(member.id)
    expect(stored?.id).toBe(member.id)
    expect(stored?.email).toBe(memberAccount.email)
    expect(stored?.recover_code).toBeNull()
  })

  it('does not return the password hash to the caller', async () => {
    const updated = await editAsAdmin(dialogPayload())

    expect(updated.password).toBeUndefined()
    expect(updated.recover_code).toBeUndefined()
  })
})
