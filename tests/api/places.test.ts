import { $fetchRaw as fetch } from 'nitro-test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { fetchWithAuth, now, cleanDatabase } from './setup'

let place_id: number

describe('Place', async () => {
  await cleanDatabase(true)
  it('should create a new place creating an event', async () => {
    let response = await fetchWithAuth('/api/events', 'POST',
      {
        title: 'test event', start_datetime: now() + 1000,
        place_name: 'test new place', place_address: 'test address'
      })
    expect(response.status).toBe(200)
    expect(response.data.is_visible).toBe(true)
    expect(response.data.place.name).toBe('test new place')
    place_id = response.data.place.id

    response = await fetch(`/api/events/place/${place_id}`)
    expect(response.status).toBe(200)
    expect(response.data.place.name).toBe('test new place')

  })

  it('should create a new place creating event using place_id', async () => {
    let response = await fetchWithAuth('/api/events', 'POST',
      {
        title: 'test event', start_datetime: now() + 1000,
        place_id
      })
    expect(response.status).toBe(200)
    expect(response.data.place.id).toBe(place_id)
  })

  it('only admin should get all places', async () => {
    let response = await fetch('/api/places/list')
    expect(response.status).toBe(401)

    response = await fetchWithAuth('/api/places/list')
    expect(response.status).toBe(200)

    expect(response.data.length).toBe(1)
  })

  it('should search for a place', async () => {
    const response = await fetch('/api/places?query=test')
    expect(response.status).toBe(200)
    expect(response.data.length).toBe(1)
  })

  it('should trim place\'s name and address', async () => {
    const ret = await fetchWithAuth('/api/events', 'POST', {
      title: 'test trimming', place_name: ' test place with white Space ',
      place_address: ' address with Space ', start_datetime: now() + 1000
    })

    expect(ret.status).toBe(200)

    expect(ret.data.place.name).toBe('test place with white Space')
    expect(ret.data.place.address).toBe('address with Space')
  })

  it('should accept a place with a postal address', async () => {
    const postalAddress = {
      type: "PostalAddress",
      addressCountry: "Austria",
      addressLocality: "Fediverse Town",
      addressRegion: "Steiermark",
      postalCode: "8010",
      streetAddress: "15 Fediverse Street"
    }
    const ret = await fetchWithAuth('/api/events', 'POST',
      {
        title: 'test postal address', place_name: 'test place',
        place_postal_address: JSON.stringify(postalAddress), start_datetime: now() + 1000
      })

    expect(ret.status).toBe(200)

    expect(ret.data.place.name).toBe('test place')
    expect(ret.data.place.address).toBe('15 Fediverse Street, Fediverse Town, Steiermark, Austria')
  })

})
