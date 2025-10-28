import { describe, expect, it } from "vitest"
import dayjs from 'dayjs'
import { fetchWithAuth } from './setup.js'

let event = {}
describe('Tags', () => {
  it('should create event with tags', async () => {

    event = await fetchWithAuth('/api/events', 'POST', 
      { 
        title: 'test tags',
        place_id: 1,
        start_datetime: dayjs().unix() + 1000,
        tags: ['tag1', 'Tag2', 'tAg3']
      })

    expect(event.data.tags.length).toBe(3)
    expect(event.data.tags).toStrictEqual(['tag1', 'Tag2', 'tAg3'])
  })


  it('should dedup tags', async () => {
    event = await fetchWithAuth('/api/events', 'POST',
      { title: 'test tags', place_id: 1, start_datetime: dayjs().unix() + 1000, tags: ['ciao', ' Ciao '] })

    expect(event.data.tags.length).toBe(1)
    expect(event.data.tags).toStrictEqual(['ciao'])
  })

  it('should not allow non-array tags field', async () => {
    const response = await fetchWithAuth('/api/events', 'POST', 
      { title: 'test non-array tags', place_id: 1, start_datetime: dayjs().unix() + 1000, tags: 'Tag1' })

    expect(response.status).toBe(400)
    expect(response.data.message).toBe('tags field must be an array')

  })

  it('should create event trimming tags / ignore sensitiviness', async () => {
    const response = await fetchWithAuth('/api/events', 'POST', 
      { title: 'test trimming tags', place_id: 1, start_datetime: dayjs().unix() + 1000, tags: ['Tag1', 'taG2 '] })
    
    expect(response.status).toBe(200)

    expect(response.data.tags.length).toBe(2)
    expect(response.data.tags[0]).toBe('tag1')
    expect(response.data.tags[1]).toBe('Tag2')
  })

  it('should modify event tags', async () => {
    const { data } = await fetchWithAuth(`/api/events/${event.data.id}`, 'PUT',
      { title: 'test trimming tags', place_id: 1, start_datetime: dayjs().unix() + 1000, tags: ['tag1', 'tag3', 'tag4'] })

    expect(data.tags).toStrictEqual(['tag1', 'tAg3', 'tag4'])
  })

  it('shoud support utf-8 chars in tag', async () => {
    const { data } = await fetchWithAuth('/api/events', 'POST',
      { title: 'test trimming tags',
        place_id: 1,
        start_datetime: dayjs().unix() + 1000,
        tags: ['/\'"%^&*~`!@#$*()_+=-\\}{', 'üniversite etkinliği', 'ÜNIVERSITE ETKINLIĞI', 'antani', '$$antan$i'] })

    expect(data.tags).toStrictEqual(['/\'"%^&*~`!@#$*()_+=-\\}{', 'üniversite etkinliği', 'antani', '$$antan$i'])

  })

  it('should autocomplete tags', async () => {
    let response = await fetchWithAuth('/api/tags', 'GET', undefined, 'none')
    expect(response.data).toEqual(
      expect.arrayContaining([ 'tag1', 'Tag2', 'üniversite etkinliği', 'tAg3', 'ciao', 'antani', '/\'"%^&*~`!@#$*()_+=-\\}{', '$$antan$i', 'test', "tag4"])
    )

    response = await fetchWithAuth('/api/tags?query=ANT', 'GET', 'none')
    expect(response.data).toHaveLength(2)
    expect(response.data).toStrictEqual(expect.arrayContaining([ 'antani', '$$antan$i']))
  })

  // it('should return events searching for tags', async () => {

  //   const response = await request(app).get('/api/events?tags=tAg3')
  //     .expect(200)

  //   expect(response.body.length).toBe(2)
  //   // expect(response.body[0].title).toBe('test tags')
  //   expect(response.body[0].tags.length).toBe(3)
  // })

//   it('should return limited events', async () => {

//     let response = await request(app).get('/api/events?max=1')
//     .expect(200)
//     expect(response.body.length).toBe(1)

//     response = await request(app).get('/api/events?max=2')
//       .expect(200)

//     expect(response.body.length).toBe(2) 


//   })
})