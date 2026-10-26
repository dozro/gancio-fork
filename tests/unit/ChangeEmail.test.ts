import { describe, expect, it, vi, afterAll } from 'vitest'
import { mockH3Event } from './utils'
import { User } from '../../server/services/db'
import { verifyJwtToken } from '../../server/lib/jwt'

import { getUser } from '../../server/lib/getUser'
import { enqueueMail } from '../../server/services/sendMail'
vi.mock('../../server/lib/getUser')
vi.mock('../../server/services/sendMail', () => ({ enqueueMail: vi.fn(), sendMail: vi.fn() }))
const mockedGetUser = vi.mocked(getUser)
const mockedEnqueueMail = vi.mocked(enqueueMail)

const { default: changeHandler } = await import('../../server/api/user/change_email.post')
const { default: confirmHandler } = await import('../../server/api/user/change_email_confirm.post')

const user = await User.create({ email: 'old@example.org', password: 'password', role: 'user', is_active: true })
const otherUser = await User.create({ email: 'taken@example.org', password: 'password', role: 'user', is_active: true })
let token: string

function change(body: unknown) {
  return changeHandler(mockH3Event({ method: 'POST', body }))
}

function confirm(body: unknown) {
  return confirmHandler(mockH3Event({ method: 'POST', body }))
}

describe('Change e-mail', () => {
  // do not leave these users around for other test files
  afterAll(async () => {
    await User.destroy({ where: { id: [user.id, otherUser.id] } })
  })

  it('should not allow anonymous users', async () => {
    mockedGetUser.mockResolvedValueOnce(undefined)
    await expect(change({ email: 'new@example.org', password: 'password' })).rejects.toHaveProperty('statusCode', 401)
  })

  it('should require the right password', async () => {
    mockedGetUser.mockResolvedValueOnce(user)
    await expect(change({ email: 'new@example.org', password: 'wrong' })).rejects.toHaveProperty('statusCode', 401)
    mockedGetUser.mockResolvedValueOnce(user)
    await expect(change({ email: 'new@example.org' })).rejects.toHaveProperty('statusCode', 400)
  })

  it('should validate the new e-mail', async () => {
    // e-mails used by other users are taken regardless of case
    for (const email of ['not an email', 'old@example.org', 'taken@example.org', 'Taken@Example.org']) {
      mockedGetUser.mockResolvedValueOnce(user)
      await expect(change({ email, password: 'password' })).rejects.toHaveProperty('statusCode', 400)
    }
    expect(mockedEnqueueMail).not.toHaveBeenCalled()
  })

  it('should send a confirmation link to the new address', async () => {
    mockedGetUser.mockResolvedValueOnce(user)
    await change({ email: 'new@example.org', password: 'password' })

    expect(mockedEnqueueMail).toHaveBeenCalledOnce()
    const [address, template, locals] = mockedEnqueueMail.mock.calls[0]!
    expect(address).toBe('new@example.org')
    expect(template).toBe('change_email')
    token = (locals as { token: string }).token
    expect(token).toBeTruthy()

    // e-mail is not changed until confirmed
    await user.reload()
    expect(user.email).toBe('old@example.org')
  })

  it('should not accept the confirmation token as bearer token', async () => {
    await expect(verifyJwtToken(token)).rejects.toThrow()
  })

  it('should not confirm with an invalid token', async () => {
    await expect(confirm({ token: 'invalid' })).rejects.toHaveProperty('statusCode', 400)
    await expect(confirm({})).rejects.toHaveProperty('statusCode', 400)
  })

  it('should change the e-mail and notify the old address', async () => {
    mockedEnqueueMail.mockClear()
    const ret = await confirm({ token })
    expect(ret).toStrictEqual({ email: 'new@example.org' })

    await user.reload()
    expect(user.email).toBe('new@example.org')

    expect(mockedEnqueueMail).toHaveBeenCalledOnce()
    const [address, template] = mockedEnqueueMail.mock.calls[0]!
    expect(address).toBe('old@example.org')
    expect(template).toBe('email_changed')
  })

  it('should not accept the same token twice', async () => {
    await expect(confirm({ token })).rejects.toHaveProperty('statusCode', 400)
  })
})
