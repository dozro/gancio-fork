import { $fetchRaw as fetch } from 'nitro-test-utils/e2e'
import { beforeAll, describe, expect, it } from 'vitest'
import { fetchWithAuth, now, cleanDatabase } from './setup'

describe('Geocoding', () => {
  beforeAll(async () => {
    await cleanDatabase(true)
  })

  it('should not be enabled by default', async () => {
    let response = await fetch('/api/settings/allow_geolocation')
    expect(response.status).toBe(200)
    expect(response.data).toBe(false)

    response = await fetch('/api/geocode?q=test')
    expect(response.status).toBe(403)
  })

  it('should geocode when enabled', async () => {
    let response = await fetchWithAuth('/api/settings', 'PUT', { key: 'allow_geolocation', value: true })
    expect(response.status).toBe(200)
    expect(response.data).toBe(true)
    
    response = await fetch('/api/settings/allow_geolocation')
    expect(response.status).toBe(200)
    expect(response.data).toBe(true)
    
    response = await fetch('/api/geocode?q=test')
    expect(response.status).toBe(200)
    expect(response.data).toBeDefined()
  })
})