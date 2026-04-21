import { describe, expect, it, vi } from 'vitest'
import { cleanDatabase } from '../api/setup'
import { mockH3Event, now } from './utils'
import { setSetting } from '../../server/services'
import { getUser } from '../../server/lib/getUser'

vi.mock('../../server/lib/getUser')
const mockedGetUser = vi.mocked(getUser)

const { adminUser, editorUser, userUser } = await cleanDatabase(true)
let event_id: number

const { default: handleEvent } = await import('../../server/api/events/index.post')
const { default: patchHandler } = await import('../../server/api/events/[id]/index.patch')
const { default: toggleHandler } = await import('../../server/api/events/[id]/toggle.put')

describe('Events', () => {
  it('should create an anon event when allowed', async () => {
    await setSetting('allow_anon_event', true)
    const event = mockH3Event({
      method: 'POST',
      body: {
        title: 'test title', place_name: 'place name',
        place_address: 'address', tags: ['test'], start_datetime: now() + 1000
      }
    })
    const response = await handleEvent(event)
    expect(response).toHaveProperty('id')
    event_id = response.id
    expect(response).toHaveProperty('title', 'test title')
    expect(response).toHaveProperty('place.name', 'place name')
    expect(response).toHaveProperty('is_visible', false) // anon event should not be visible
    expect(response).toHaveProperty('is_anon', true)
  })

  it('should not create an event if anon event is not allowed', async () => {
    await setSetting('allow_anon_event', false)
    const event = mockH3Event({
      method: 'POST',
      body: {
        title: 'test title', place_name: 'place name',
        place_address: 'address', tags: ['test'], start_datetime: now() + 1000
      }
    })
    const response = handleEvent(event)
    await expect(response).rejects.toHaveProperty('statusCode', 400)
    await expect(response).rejects.toHaveProperty('message', 'Anonymous event update/creation not allowed')
  })

  it('should not allow event creation without required fields', async () => {
    const required_fields = {
      'title': {},
      'start_datetime': { title: 'test title' },
      'place_id or place_name and place_address are': { title: 'test title', start_datetime: now(), place_name: 'test place name' }
    }

    const promises = Object.keys(required_fields).map(async (field) => {
      const event = mockH3Event({ method: 'POST', body: required_fields[field] })
      const response = handleEvent(event)
      await expect(response).rejects.toHaveProperty('statusCode', 400)
      await expect(response).rejects.toHaveProperty('message', `${field} required`)
    })
    await Promise.all(promises)
  })

  it('should not get unconfirmed events', async () => {
    const { default: detailHandler } = await import('../../server/api/event/detail/[slug_or_id]')
    const detail = detailHandler(mockH3Event({ params: { slug_or_id: String(event_id) } }))
    await expect(detail).rejects.toHaveProperty('statusCode', 404)
    await expect(detail).rejects.toHaveProperty('statusMessage', 'Event not found')
  })

  it('should confirm/unconfirm event if allowed', async () => {
    mockedGetUser.mockResolvedValueOnce(undefined)
    let response = toggleHandler(mockH3Event({ method: 'PUT', params: { id: String(event_id) } }))
    await expect(response).rejects.toHaveProperty('statusMessage', 'Unauthorized')
    await expect(response).rejects.toHaveProperty('statusCode', 401)

    mockedGetUser.mockResolvedValueOnce(userUser)
    response = toggleHandler(mockH3Event({ method: 'PUT', params: { id: String(event_id) } }))
    await expect(response).rejects.toHaveProperty('statusMessage', 'Unauthorized')
    await expect(response).rejects.toHaveProperty('statusCode', 401)

    mockedGetUser.mockResolvedValueOnce(adminUser) // mock an admin user
    response = toggleHandler(mockH3Event({ method: 'PUT', params: { id: String(event_id) } }))
    await expect(response).resolves.toHaveProperty('is_visible', true)

    mockedGetUser.mockResolvedValueOnce(editorUser) // mock an editor user
    response = toggleHandler(mockH3Event({ method: 'PUT', params: { id: String(event_id) } }))
    await expect(response).resolves.toHaveProperty('is_visible', false)
  })

  it('should create an event as normal user', async () => {
    mockedGetUser.mockResolvedValueOnce(userUser)
    const event = mockH3Event({
      method: 'POST',
      body: {
        title: 'test title', place_name: 'place name',
        place_address: 'address', tags: ['test'], start_datetime: now() + 1000
      }
    })
    const response = await handleEvent(event)
    expect(response).toHaveProperty('id')
    event_id = response.id
    expect(response).toHaveProperty('title', 'test title')
    expect(response).toHaveProperty('place.name', 'place name')
    expect(response).toHaveProperty('is_visible', true)
    expect(response).toHaveProperty('is_mine', true)
    expect(response).toHaveProperty('is_anon', false)
  })

  it('should get detail of my hidden event', async () => {
    const { default: detailHandler } = await import('../../server/api/event/detail/[slug_or_id]')
    mockedGetUser.mockResolvedValue(userUser)
    const detail = await detailHandler(mockH3Event({ params: { slug_or_id: String(event_id) } }))
    expect(detail).toHaveProperty('id', event_id)
    expect(detail).toHaveProperty('title', 'test title')
    await toggleHandler(mockH3Event({ method: 'PUT', params: { id: String(event_id) } })) // hide the event
    const detail2 = await detailHandler(mockH3Event({ params: { slug_or_id: String(event_id) } }))
    expect(detail2).toHaveProperty('id', event_id)
    expect(detail2).toHaveProperty('title', 'test title')
  })

  it('should patch event status if allowed', async () => {
    mockedGetUser.mockResolvedValue(undefined)
    let response = patchHandler(mockH3Event({ params: { id: String(event_id) }, body: { status: 'EventCancelled' } }))
    await expect(response).rejects.toHaveProperty('statusCode', 401)
    await expect(response).rejects.toHaveProperty('statusMessage', 'Anonymous user cannot patch events')

    mockedGetUser.mockResolvedValueOnce(userUser)
    response = patchHandler(mockH3Event({ params: { id: String(event_id) }, body: { status: 'EventCancelled' } }))
    await expect(response).resolves.toHaveProperty('status', 'EventCancelled')
  })

  it('should not allow start_datetime greater than end_datetime', async () => {
    const event = {
      title: ' test title 5',
      place_name: 'test',
      place_address: 'test',
      start_datetime: now() + 1000,
      end_datetime: now()
    }

    const response = handleEvent(mockH3Event({ body: event }))
    await expect(response).rejects.toHaveProperty('statusCode', 400)
    await expect(response).rejects.toHaveProperty('message', 'start_datetime is greater than end_datetime')
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