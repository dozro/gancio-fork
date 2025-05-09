import { describe, expect, it } from "vitest"
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

const base_url = 'http://localhost:13120'
import path from 'path'
import type { Event } from "#build/types/nitro-imports"
import { headers } from "happy-dom/lib/PropertySymbol.js"

await setup({ host: base_url })

const admin = { username: 'admin', password: 'test', grant_type: 'password', client_id: 'self' }

let token: string
let app
let places = []
let event_id: number


describe('Basic', () => {
  it('shoud return an empty list', async () => {
    const ret: Array<Event> = await $fetch('/api/events')
    expect(ret?.length).toBe(0)
  })
})

describe('Authentication / Authorization', () => {
  it('should not return an user when not authenticated', async () => {
    const { status } = await fetch('/api/user')
    expect(status).toBe(403)
  })

  it('should not authenticate with wrong user/password', async () => {
    const { status, body } = await fetch('/api/user', {
      method: 'POST',
      headers: { 'content-type': 'application/x-wwww-form-urlencoded' },
      body: { email: 'admin', password: 'wrong' }})
  
    expect(status).toBe(401)
    
  })

  it('should register an admin as first user', async () => {
    const { status, body } = await fetch('/api/user/register', {
      method: 'POST',
      body: { email: 'admin', password: 'test' }})
    
    expect(status).toBe(200)
    expect(body?.id).toBeDefined()
    
  })

  it('should authenticate with correct user/password', async () => {
    const { status, body } = await fetch('/oauth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/x-wwww-form-urlencoded' },
      body: admin
    })

    expect(status).toBe(200)
    expect(body?.refresh_token).toBeDefined()
    expect(body?.access_token).toBeDefined()
    expect(body?.token_type).toBe('Bearer')
    token = body
  })

  it('should get user when authenticated', async () => {
    const { status, body } = await fetch('/api/user', {
      headers: { authorization: `Bearer ${token.access_token}` }
    })
    
    expect(status).toBe(200)
    expect(body?.email).toBe(admin.username)
    expect(body?.is_admin).toBe(true)
  })
})

// describe('Settings', () => {

//   it('should not change settings when not allowed', () => {
//     return request(app).post('/api/settings')
//       .send({ key: 'allow_anon_event', value: false })
//       .expect(403)
//   })

//   it('should change settings when allowed', () => {
//     return request(app).post('/api/settings')
//       .send({ key: 'allow_anon_event', value: true })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)
//   })

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

// })

// describe('Events', () => {

//   it('should not allow event creation without required fields', async () => {
//     const required_fields = {
//       'title': {},
//       'start_datetime': { title: 'test title' },
//       'place_id or place_name and place_address are': { title: 'test title', start_datetime: dayjs().unix() + 1000, place_name: 'test place name' },
//     }

//     const promises = Object.keys(required_fields).map(async field => {
//       const response = await request(app).post('/api/event').send(required_fields[field])
//         .expect(400)
//       expect(response.text).toBe(`${field} required`)
//     })

//     await Promise.all(promises)
//   })

//   it('should create anon event only when allowed', async () => {
//     await request(app).post('/api/settings')
//       .send({ key: 'allow_anon_event', value: false })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     await request(app).post('/api/event')
//       .expect(403)

//     let response = await request(app).post('/api/event')
//       .send({ title: 'test title 2', place_name: 'place name', place_address: 'address', tags: ['test'], start_datetime: dayjs().unix() + 1000 })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(response.body.place.id).toBeDefined()
//     places.push(response.body.place.id)

//     await request(app).post('/api/settings')
//       .send({ key: 'allow_anon_event', value: true })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     response = await request(app).post('/api/event')
//       .send({ title: 'test title 3', place_name: 'place name 2', place_address: 'address 2', tags: ['test'], start_datetime: dayjs().unix() + 1000 })
//       .expect(200)

//     expect(response.body.place.id).toBeDefined()
//     places.push(response.body.place.id)

//   })

//   it('should not confirm anon events', async () => {
//     const response = await request(app).post('/api/event')
//       .send({ title: 'test title 6', place_id: places[0], start_datetime: dayjs().unix() + 1000 })
//       .expect(200)
    
//     expect(response.body.is_visible).toBe(false)
//     event_id = response.body.id
//   })

//   it('should not get unconfirmed events', async () => {
//     let response = await request(app).get(`/api/event/detail/${event_id}`)
//       .expect(404)

//       response = await request(app).get(`/api/event/detail/${event_id}`)
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)      
//   })

//   it('should confirm event if allowed', async () => {
//     let response = await request(app).put(`/api/event/confirm/${event_id}`)
//       .send()
//       .expect(403)

//     response = await request(app).put(`/api/event/confirm/${event_id}`)
//       .auth(token.access_token, { type: 'bearer' })
//       .send()
//       .expect(200)      
//   })

//   it('should not allow start_datetime greater than end_datetime', async () => {

//     const event = {
//       title: ' test title 5',
//       place_id: places[0],
//       start_datetime: dayjs().unix() + 1000,
//       end_datetime: dayjs().unix(),
//     }

//     const response = await request(app).post('/api/event')
//       .send(event)
//       .expect(400)
    
//     expect(response.text).toBe('start datetime is greater than end datetime')
//   })

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


// })

// let event = {}
// describe('Tags', () => {
//   it('should create event with tags', async () => {

//     event = await request(app).post('/api/event')
//       .send({ title: 'test tags', place_id: places[1], start_datetime: dayjs().unix() + 1000, tags: ['tag1', 'Tag2', 'tAg3'] })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(event.body.tags.length).toBe(3)
//     expect(event.body.tags).toStrictEqual(['tag1', 'Tag2', 'tAg3'])
//   })

//   it('should dedup tags', async () => {

//     event = await request(app).post('/api/event')
//       .send({ title: 'test tags', place_id: places[0], start_datetime: dayjs().unix() + 1000, tags: ['ciao', ' Ciao '] })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(event.body.tags.length).toBe(1)
//     expect(event.body.tags).toStrictEqual(['ciao'])
//   })

//   it('should not allow non-array tags field', async () => {
//     const response = await request(app).post('/api/event')
//       .send({ title: 'test non-array tags', place_id: places[1], start_datetime: dayjs().unix() + 1000, tags: 'Tag1' })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(400)

//     expect(response.text).toBe('tags field must be an array')

//   })

//   it('should create event trimming tags / ignore sensitiviness', async () => {
//     const ret = await request(app).post('/api/event')
//       .send({ title: 'test trimming tags', place_id: places[1], start_datetime: dayjs().unix() + 1000, tags: ['Tag1', 'taG2 '] })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(ret.body.tags.length).toBe(2)
//     // expect(ret.body.tags).toStrictEqual(['Tag1', 'taG2'])
//     expect(ret.body.tags[0]).toBe('tag1')
//     expect(ret.body.tags[1]).toBe('Tag2')
//   })

//   it('should modify event tags', async () => {
//     const ret = await request(app).put('/api/event')
//       .send({ id: event.body.id, tags: ['tag1', 'tag3', 'tag4'], place_id: places[0] })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(ret.body.tags).toStrictEqual(['tag1', 'tAg3', 'tag4'])
//   })

//   it('shoud support utf-8 chars in tag', async () => {
//     let ret = await request(app).post('/api/event')
//       .send({ title: 'test trimming tags',
//         place_id: places[1],
//         start_datetime: dayjs().unix() + 1000,
//         tags: ['/\'"%^&*~`!@#$*()_+=-\\}{', 'üniversite etkinliği', 'ÜNIVERSITE ETKINLIĞI', 'antani', '$$antan$i'] })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(ret.body.tags).toEqual(expect.arrayContaining(['/\'"%^&*~`!@#$*()_+=-\\}{', 'üniversite etkinliği', 'antani', '$$antan$i']))

//     ret = await request(app).post('/api/event')
//     .send({ title: 'test trimming tags',
//       place_id: places[0],
//       start_datetime: dayjs().unix() + 1000,
//       tags: ['/\'"%^&*~`!@#$*()_+=-\\}{', 'üniversite etkinliği', 'ÜNIVERSITE ETKINLIĞI', 'antani', '$$antan$i'] })
//     .auth(token.access_token, { type: 'bearer' })
//     .expect(200)

//     expect(ret.body.tags).toStrictEqual(expect.arrayContaining(['/\'"%^&*~`!@#$*()_+=-\\}{', 'üniversite etkinliği', 'antani', '$$antan$i']))

//   })

//   it('should return events searching for tags', async () => {

//     const response = await request(app).get('/api/events?tags=tAg3')
//       .expect(200)

//     expect(response.body.length).toBe(2)
//     // expect(response.body[0].title).toBe('test tags')
//     expect(response.body[0].tags.length).toBe(3)
//   })

//   it('should return limited events', async () => {

//     let response = await request(app).get('/api/events?max=1')
//     .expect(200)
//     expect(response.body.length).toBe(1)

//     response = await request(app).get('/api/events?max=2')
//       .expect(200)

//     expect(response.body.length).toBe(2) 


//   })
// })

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

// let collections = []
// let filters = []
// describe('Collection', () => {
//   it('should not create a new collection if not allowed', () => {
//     return request(app).post('/api/collections')
//       .send({ name: 'test collection' })
//       .expect(403)
//   })

//   it('should create a new collection', async () => {
//     const response = await request(app).post('/api/collections')
//       .send({ name: 'test collection' })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)
//     expect(response.body.id).toBeDefined()
//     collections.push(response.body)
//   })

//   it('should do not have any event when no filters', async () => {
//     const response = await request(app).get('/api/collections/test collection')
//       .expect(200)

//     expect(response.body.length).toBe(0)
//   })

//   it('should add a new filter', async () => {
//     await request(app)
//       .post('/api/filter')
//       .send({ collectionId: collections[0].id, tags: ['test'] })
//       .expect(403)

//     const response = await request(app).post('/api/filter')
//       .send({ collectionId: collections[0].id, tags: ['test'] })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(response.body.id).toBeDefined()
//     filters.push(response.body.id)

//   })

//   it('shoud get collection\'s filters using withFilters parameter', async () => {
//     let response = await request(app)
//       .get('/api/collections?withFilters=true')
//       .expect(200)

//     expect(response.body.length).toBe(1)
//     expect(response.body[0].name).toBe('test collection')
//     expect(response.body[0].filters.length).toBe(1)
//     expect(response.body[0].filters[0].tags.length).toBe(1)
//     expect(response.body[0].filters[0].tags[0]).toBe('test')

//     response = await request(app)
//       .get('/api/collections')
//       .expect(200)
//     expect(response.body[0].filters).toBeUndefined()


//     response = await request(app)
//       .get('/api/collections?withFilters=false')
//       .expect(200)
//     expect(response.body[0].filters).toBeUndefined()

//   })

//   it('should get collection events', async () => {
//     const response = await request(app)
//       .get(`/api/collections/test collection`)
//       .expect(200)

//     expect(response.body.length).toBe(1)
//   })

//   it('should remove filter', async () => {
//     await request(app)
//       .delete(`/api/filter/${filters[0]}`)
//       .expect(403)

//     await request(app)
//       .delete(`/api/filter/${filters[0]}`)
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     const response = await request(app)
//       .get(`/api/filter/${filters[0]}`)
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     expect(response.body.length).toBe(0)
//   })

//   it('shoud filter for tags', async () => {
//     await request(app)
//       .post('/api/filter')
//       .send({ collectionId: collections[0].id, tags: ['test'] })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)


//     const response = await request(app)
//       .get(`/api/collections/test collection`)
//       .expect(200)

//     expect(response.body.length).toBe(1)

//   })

//   it('should create a second collection', async () => {
//     let response = await request(app).post('/api/collections')
//       .send({ name: 'second collection' })
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)
//     expect(response.body.id).toBeDefined()
//     collections.push(response.body)

//     response = await request(app)
//       .get('/api/collections')
//       .expect(200)
//     expect(response.body?.length).toBe(2)
//     expect(response.body[0].id).toBe(collections[0].id)
//     expect(response.body[1].id).toBe(collections[1].id)

//   })

//   it('should change collections order', async () =>{
//     let response = await request(app).put(`/api/collection/moveup/${collections[1].sortIndex}`)
//       .auth(token.access_token, { type: 'bearer' })
//       .expect(200)

//     response = await request(app)
//       .get('/api/collections')
//       .expect(200)
//     expect(response.body?.length).toBe(2)
//     expect(response.body[0].id).toBe(collections[1].id)
//     expect(response.body[1].id).toBe(collections[0].id)

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
