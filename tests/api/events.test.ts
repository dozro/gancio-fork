import { $fetchRaw as fetch } from 'nitro-test-utils/e2e'
import { beforeAll, describe, expect, it } from 'vitest'
import { fetchWithAuth, now, cleanDatabase } from './setup'

let event_id: number
let places: any = []
describe('Events', () => {
  beforeAll(async () => {
    await cleanDatabase(true)
  })
  it('should not allow event creation without required fields', async () => {
    const required_fields = {
      'title': {},
      'start_datetime': { title: 'test title' },
      'place_id or place_name and place_address are': { title: 'test title', start_datetime: now(), place_name: 'test place name' }
    }

    const promises = Object.keys(required_fields).map(async (field) => {
      const response = await fetchWithAuth('/api/events',
        'POST', required_fields[field])
      expect(response.status).toBe(400)
      expect(response.data.message).toBe(`${field} required`)
    })

    await Promise.all(promises)
  })

  it('should create anon event only when allowed', async () => {
    let response = await fetchWithAuth('/api/settings', 'PUT', { key: 'allow_anon_event', value: false })
    expect(response.status).toBe(200)

    response = await fetchWithAuth('/api/events', 'POST', undefined, 'none')
    expect(response.ok).toBe(false)

    response = await fetchWithAuth('/api/events', 'POST', {
      title: 'test title 2', place_name: 'place name',
      place_address: 'address', tags: ['test'], start_datetime: now() + 1000
    })
    expect(response.ok).toBe(true)

    expect(response.data.place.id).toBeDefined()
    places.push(response.data.place.id)

    response = await fetchWithAuth('/api/settings', 'PUT', { key: 'allow_anon_event', value: true })
    expect(response.status).toBe(200)

    response = await fetchWithAuth('/api/events', 'POST', {
      title: 'test title 3', place_name: 'place name 2',
      place_address: 'address 2', tags: ['test'], start_datetime: now() + 1000
    }, 'none')
    expect(response.ok).toBe(true)

    expect(response.data.place.id).toBeDefined()
    places.push(response.data.place.id)
  })

  it('should not confirm anon events', async () => {
    const response = await fetchWithAuth('/api/events', 'POST', {
      title: 'test title 6', place_name: 'place name 2',
      place_address: 'address 2',
      start_datetime: now() + 1000
    }, 'none')

    expect(response.data.is_visible).toBe(false)
    expect(response.data.is_anon).toBe(true)
    event_id = response.data.id
  })

  it('should not get unconfirmed events', async () => {
    let response = await fetch(`/api/event/detail/${event_id}`)
    expect(response.status).toBe(404)

    response = await fetchWithAuth(`/api/event/detail/${event_id}`)
    expect(response.status).toBe(200)
  })

  it('should confirm event if allowed', async () => {
    let response = await fetch(`/api/events/${event_id}/toggle`, { method: 'PUT' })
    expect(response.status).toBe(401)

    response = await fetchWithAuth(`/api/events/${event_id}/toggle`, 'PUT')
    expect(response.status).toBe(200)
  })

  it('should not allow start_datetime greater than end_datetime', async () => {
    const event = {
      title: ' test title 5',
      place_name: 'test',
      place_address: 'test',
      start_datetime: now() + 1000,
      end_datetime: now()
    }

    const response = await fetchWithAuth('/api/events', 'POST', event)

    expect(response.status).toBe(400)
    expect(response.data.message).toBe('start_datetime is greater than end_datetime')
  })

  //   it('should not allow start_datetime greater than 3000', async () => {

  //     const event = {
  //       title: ' test title 5',
  //       start_datetime: dayjs().set('year', 4000).unix(),
  //       place_id: places[0],
  //     }

  //     const response = await request(app).post('/api/event')
  //       .send(event)
  //       .expect(400)

  //     expect(response.text).toBe('are you sure?')
  //   })

  //   it('should validate start_datime', async () => {
  //     const event = {
  //       title: ' test title 5',
  //       start_datetime: "antani",
  //       place_id: places[0],
  //     }

  //     const response = await request(app).post('/api/event')
  //       .send(event)
  //       .expect(400)
  //   })

  //   it('should validate end_datime', async () => {
  //     const event = {
  //       title: ' test title 5',
  //       start_datetime: dayjs().unix() + 1000,
  //       end_datetime: "Antani",
  //       place_id: places[0],
  //     }

  //     const response = await request(app).post('/api/event')
  //       .send(event)
  //       .expect(400)
  //   })

  //   it('should not allow create anonymous event in the past', async() => {
  //     const time_in_past = dayjs().unix() - 1;

  //     await request(app).post('/api/event')
  //       .send({
  //         title: 'anonymous event in the past',
  //         place_id: places[0],
  //         start_datetime: time_in_past
  //       })
  //       .expect(400)
  //       .then(response => {
  //         expect(response.text)
  //           .toEqual('Anonymous user cannot create past events')
  //       })
  //   })

  //   it('should allow create event in the past when authenticated', async() => {
  //     const time_in_past = dayjs().unix() - 1

  //     await request(app).post('/api/event')
  //       .send({
  //         title: 'authenticated event in the past',
  //         place_id: places[0],
  //         start_datetime: time_in_past
  //       })
  //       .auth(token.access_token, { type: 'bearer' })
  //       .expect(200)
  //   })

  //   it('should trim tags and title', async () => {
  //     const event = {
  //       title: ' test title 4 ',
  //       place_id: places[0],
  //       start_datetime: dayjs().unix() + 1000,
  //       tags: [' test tag ']
  //     }

  //     const response = await request(app).post('/api/event')
  //       .send(event)
  //       .expect(200)
  //       .expect('Content-Type', /json/)

  //     expect(response.body.title).toBe('test title 4')
  //     expect(response.body.tags[0]).toBe('test tag')
  //   })

  //   it('should sanitize htlm in description', async () => {

  //     const event = {
  //       title: 'test title',
  //       place_id: places[0],
  //       start_datetime: dayjs().unix() + 1000,
  //       tags: ['test tags'],
  //       description: `<p wrong-attr="" onclick="alert('test');">inside paragraph</p><a href="https://test.com/?query=true&fbclid=facebook_id">link with fb reference</a>`
  //     }

  //     const response = await request(app).post('/api/event')
  //       .send(event)
  //       .expect(200)
  //       .expect('Content-Type', /json/)

  //     event_id = response.body.id
  //     expect(response.body.description).toBe(`<p>inside paragraph</p><a href="https://test.com/?query=true">link with fb reference</a>`)

  //   })

  //   it('should not update event with invalid start_datetime', async () => {
  //     const event = {
  //       id: event_id,
  //       place_id: places[0],
  //       start_datetime: "antani"
  //     }

  //     const response = await request(app).put('/api/event')
  //       .auth(token.access_token, { type: 'bearer' })
  //       .send(event)
  //       .expect(400)

  //     expect(response.text).toBe('Wrong format for start datetime')
  //   })

  //   it('should not update event with invalid end_datetime', async () => {
  //     const event = {
  //       id: event_id,
  //       place_id: places[0],
  //       end_datetime: 2
  //     }

  //     const response = await request(app).put('/api/event')
  //       .auth(token.access_token, { type: 'bearer' })
  //       .send(event)
  //       .expect(400)

  //     expect(response.text).toBe('start datetime is greater than end datetime')
  //   })
})


