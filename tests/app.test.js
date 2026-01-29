import { describe, expect, it } from 'vitest'
import { $fetch, fetch } from '@nuxt/test-utils/e2e'
import { fetchWithAuth, admin, setCookie, cookie, setup, now } from './setup.js'

await setup(false)
let event_id
let places = []

describe('Basic', () => {
  it('shoud return an empty list', async () => {
    const ret = await $fetch('/api/events')
    expect(ret?.length).toBe(0)
  })
})

describe('Authentication / Authorization', () => {
  it('should not return an user when not authenticated', async () => {
    const { status } = await fetch('/api/user')
    expect(status).toBe(401)
  })

  it('should not authenticate with wrong user/password', async () => {
    const { status } = await fetch('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: 'wrong' })
    })

    expect(status).toBe(401)
  })

  it('should register an admin as first user', async () => {
    const ret = await fetch('/api/user/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: admin
    })

    expect(ret.status).toBe(200)
    const user = await ret.json()
    expect(user?.id).toBeDefined()
  })

  it('should authenticate with correct user/password', async () => {
    const { status, headers } = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: admin
    })

    expect(status).toBe(200)
    const cookie = headers.get('set-cookie')
    expect(cookie).toContain('nuxt-session=')
    setCookie(cookie)
  })

  it('should get user when authenticated via cookie', async () => {
    const response = await fetch('/api/user', { headers: { cookie } })
    expect(response.ok).toBe(true)
    // console.error(response)
    // const user = await response.json()
    // expect(user.email).toBe('admin')
  })

  // it('should authenticate with correct user/password and get JWT token', async () => {
  //   const response = await fetch('/api/login/token', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: admin
  //   })

  //   const json = await response.json()
  //   expect(response.status).toBe(200)
  //   expect(json?.access_token).toBeDefined()
  //   expect(typeof json.access_token).toBe('string')
  //   token = json.access_token
  // })

  // it('should get user when authenticated via JWT', async () => {
  //   const response = await fetch('/api/user', { headers: { 'Authorization': `Bearer ${token}` } })
  //   expect(response.ok).toBe(true)
  //   expect(response.body?.email).toBe('admin')
  //   // expect(body?.is_admin).toBe(true)
  // })
})

describe('Settings', () => {
  it('should not change settings when not allowed', async () => {
    const response = await fetch('/api/settings', { method: 'PUT', body: JSON.stringify({ key: 'allow_anon_event', value: false }) })
    expect(response.status).toBe(401)
  })

  it('should change settings when allowed', async () => {
    const response = await fetchWithAuth('/api/settings', 'PUT', { key: 'allow_anon_event', value: true })

    expect(response.ok).toBe(true)
  })

  //   it('should retrieve stored array settings', async () => {
  //     await request(app).post('/api/settings')
  //       .auth(token.access_token, { type: 'bearer' })
  //       .send({ key: 'test', value: [1, 2, 'test'] })
  //       .expect(200)

  //     const response = await request(app)
  //       .get('/api/settings')
  //       .auth(token.access_token, { type: 'bearer' })
  //       .expect(200)

  //     expect(response.body.test.length).toBe(3)
  //     expect(response.body.test).toStrictEqual([1, 2, 'test'])
  //   })

  //   it('should retrieve stored object settings', async () => {
  //     await request(app).post('/api/settings')
  //       .auth(token.access_token, { type: 'bearer' })
  //       .send({ key: 'test', value: { name: 'test object' } })
  //       .expect(200)

  //     const response = await request(app)
  //       .get('/api/settings')
  //       .auth(token.access_token, { type: 'bearer' })
  //       .expect(200)

  //     expect(response.body.test.name).toBe('test object')
  //   })

  //   it('should retrieve stored string settings', async () => {
  //     await request(app).post('/api/settings')
  //       .auth(token.access_token, { type: 'bearer' })
  //       .send({ key: 'test', value: 'test string' })
  //       .expect(200)

  //     const response = await request(app)
  //       .get('/api/settings')
  //       .auth(token.access_token, { type: 'bearer' })
  //       .expect(200)

  //     expect(response.body.test).toBe('test string')
  //   })
})

describe('Events', () => {
  it('should not allow event creation without required fields', async () => {
    const required_fields = {
      'title': {},
      'start_datetime': { title: 'test title' },
      'place_id or place_name and place_address are': { title: 'test title', start_datetime: now(), place_name: 'test place name' }
    }

    const promises = Object.keys(required_fields).map(async (field) => {
      const response = await fetchWithAuth('/api/events', 'POST', required_fields[field])
      expect(response.status).toBe(400)
      expect(response.statusText).toBe(`${field} required`)
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
    },
    'none')

    expect(response.data.is_visible).toBe(false)
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
      place_id: places[0],
      start_datetime: now() + 1000,
      end_datetime: now()
    }

    const response = await fetchWithAuth('/api/events', 'POST', event)

    expect(response.status).toBe(400)
    expect(response.data.message).toBe('start datetime is greater than end datetime')
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

// let event = {}

// describe('Place', () => {
//   it('should get events by place', async () => {

//     const response = await request(app).get('/api/place/place name 2')
//       .expect(200)

//     expect(response.body.place.name).toBe('place name 2')
//     expect(response.body.events.length).toBe(4)
//     expect(response.body.events[0].place.name).toBe('place name 2')
//   })

//   it('admin should get all places', async () => {
//     await request(app).get('/api/places')
//       .expect(403)

//     const response = await request(app).get('/api/places')
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(response.body.length).toBe(2)
//   })

//   it('should search for a place', async () => {
//     const response = await request(app).get('/api/place?search=place')
//       .expect(200)

//     expect(response.body.length).toBe(2)
//   })

//   it('should trim place\'s name and address', async () => {
//     const ret = await request(app).post('/api/event')
//       .send({ title: 'test trimming', place_name: ' test place with white Space ',
//         place_address: ' address with Space ', start_datetime: dayjs().unix() + 1000 })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(ret.body.place.name).toBe('test place with white Space')
//     expect(ret.body.place.address).toBe('address with Space')
//   })

// })

// describe('Export', () => {
//   it('should export an rss feed', async () => {
//     await request(app).get('/feed/rss')
//       .expect('Content-Type', /application\/rss\+xml/)
//       .expect(200)

//     await request(app).get('/api/export/rss')
//       .expect('Content-Type', /application\/rss\+xml/)
//       .expect(200)
//   })

//   it('should export a json feed', async () => {
//     await request(app).get('/feed/json')
//       .expect('Content-Type', /application\/json/)
//       .expect(200)

//     await request(app).get('/api/export/json')
//       .expect('Content-Type', /application\/json/)
//       .expect(200)
//   })

//   it('should export an ics feed', async () => {
//     await request(app).get('/feed/ics')
//       .expect('Content-Type', /text\/calendar/)
//       .expect(200)

//       await request(app).get('/api/export/ics')
//       .expect('Content-Type', /text\/calendar/)
//       .expect(200)
//   })
// })

// describe('Geocoding', () => {
//   it('should not be enabled by default', async () => {

//     await request(app)
//       .post('/api/settings')
//       .send({ key: 'allow_geolocation', value: false })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     const response = await request(app).get('/api/placeOSM/Nominatim/test')
//       .expect(403)

//     expect(response.body).toBeDefined()

//   })

//   it('should geocode when enabled', async () => {
//     await request(app)
//       .post('/api/settings')
//       .send({ key: 'allow_geolocation', value: true })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     const response = await request(app).get('/api/placeOSM/Nominatim/test')
//       .expect(200)

//     expect(response.body).toBeDefined()
//   })

//   describe('SMTP', () => {
//     it ('should send email', async () => {
//       const mail = require('../server/api/mail.js')
//       await expect(mail._send('test@cisti.org', 'test')).rejects.toThrow("connect ECONNREFUSED")
//     })
//   })
// })
