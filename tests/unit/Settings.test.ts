import { describe, it, expect, vi } from 'vitest'
import { loadSettings } from '../../server/services'
import { getUser } from '../../server/lib/getUser'
import { mockH3Event, loadTestUsers } from './utils'
import handler from '../../server/api/settings/index.put'

vi.mock('../../server/lib/getUser')
const mockedGetUser = vi.mocked(getUser)

const { adminUser, userUser } = await loadTestUsers()

describe('Settings', () => {
  it('should load settings', async () => {
    // this is loaded twice because the first time should create the pub/priv key
    await loadSettings()
    const publicSettings = await loadSettings()
    expect(publicSettings.publicKey).toBeDefined()
  })

  it('should not change settings when not allowed', async () => {
    mockedGetUser.mockResolvedValueOnce(userUser)
    const evt = mockH3Event({ method: 'PUT', body: { key: 'allow_anon_event', value: false } })
    const ret = handler(evt)
    await expect(ret).rejects.toThrow('Unauthorized')
  })

  it('should change settings when allowed', async () => {
    mockedGetUser.mockResolvedValueOnce(adminUser)
    const evt = mockH3Event({ method: 'PUT', body: { key: 'allow_anon_event', value: true } })
    const ret = await handler(evt)
    expect(evt.node.res.statusCode).toBe(200)
    expect(ret).toBe(true)
  })
})