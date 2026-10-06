import { describe, expect, it, vi } from 'vitest'
import { mockH3Event, cleanDatabase, loadTestUsers } from './utils'
import { getUser } from '../../server/lib/getUser'
import { connect } from '../../server/services/db'
import type { Collection } from '../../server/services'

const db = await connect()
await cleanDatabase(db)
vi.mock('../../server/lib/getUser')
const mockedGetUser = vi.mocked(getUser)

const collections: Collection[] = []
const filters = []
const { adminUser } = await loadTestUsers()

const { default: postCollectionHandler } = await import('../../server/api/collections/index.post')
const { default: getCollection } = await import('../../server/api/collections/[id].get')
const { default: getCollections } = await import('../../server/api/collections/index.get')
const { default: addFilter } = await import('../../server/api/filters/index.post')

describe('Collection', async () => {
  it('should not create a new collection if not allowed', async () => {
    mockedGetUser.mockResolvedValueOnce(undefined)
    const event = mockH3Event({ body: { name: 'test' } })
    const response = postCollectionHandler(event)
    await expect(response).rejects.toHaveProperty('statusCode', 401)
    await expect(response).rejects.toHaveProperty('message', 'Unauthorized')
  })

  it('should create a new collection', async () => {
    mockedGetUser.mockResolvedValueOnce(adminUser)
    const event = mockH3Event({ body: { name: 'test' } })
    const response = await postCollectionHandler(event)
    expect(response).toHaveProperty('id')
    expect(response).toHaveProperty('name', 'test')
    collections.push(response)
  })

  it('should not have any event when no filters', async () => {
    const event = mockH3Event({ params: { id: 'test' } })
    const events = await getCollection(event)
    expect(events).toEqual([])
  })

  it('should add a new filter (tag: test) only when allowed', async () => {
    const evt = mockH3Event({ body: { collectionId: collections[0].id, tags: ['test'] } })
    let ret = addFilter(evt)
    await expect(ret).rejects.toHaveProperty('message', 'Unauthorized')

    mockedGetUser.mockResolvedValueOnce(adminUser)
    ret = await addFilter(evt)
    expect(ret).toHaveProperty('tags', ['test'])
    filters.push(ret?.id)
  })

  it('should not have any event when no filters', async () => {
    const event = mockH3Event({ params: { id: 'test' }, query: { limit: '1' } })
    const events = await getCollection(event)
    expect(events).toEqual([])
  })

  it('shoud get collection\'s filters using withFilters parameter', async () => {
    mockedGetUser.mockResolvedValueOnce(adminUser)
    const evt = mockH3Event({ query: { withFilters: 'true' } })

    let ret = await getCollections(evt)
    expect(ret.length).toBe(1)
    expect(ret[0].filters.length).toBe(1)
    expect(ret[0].filters[0].tags.length).toBe(1)
    expect(ret[0].filters[0].tags[0]).toBe('test')

    ret = await getCollections(mockH3Event({}))
    expect(ret[0]?.filters).toBeUndefined()

    ret = await getCollections(mockH3Event({ query: { withFilters: 'false' } }))
    expect(ret[0]?.filters).toBeUndefined()
  })

  // it('should get collection events', async () => {
  //   const ret = await getCollection(mockH3Event({ params: { id: 'test' } }))
  //   expect(ret).toBe(1)
  // })

  //   // it('should remove filter', async () => {
  //   //   await request(app)
  //   //     .delete(`/api/filter/${filters[0]}`)
  //   //     .expect(403)

  //   // await request(app)
  //   //   .delete(`/api/filter/${filters[0]}`)
  //   //   .auth(token.access_token, { type: 'bearer' })
  //   //   .expect(200)

  //   // const response = await request(app)
  //   //   .get(`/api/filter/${filters[0]}`)
  //   //   .auth(token.access_token, { type: 'bearer' })
  //   //   .expect(200)

  //   //   expect(response.body.length).toBe(0)
  //   // })

  //   // it('shoud filter for tags', async () => {
  //   //
  //   // })
  //   //

  //   it('should create a second collection', async () => {
  //     let response = await fetchWithAuth('/api/collections', 'POST', { name: 'second collection' })
  //     expect(response.status).toBe(200)
  //     expect(response.data.id).toBeDefined()
  //     collections.push(response.data)

  //     response = await fetchWithAuth('/api/collections')
  //     expect(response.status).toBe(200)
  //     expect(response.data?.length).toBe(2)
  //     expect(response.data[0].id).toBe(collections[0].id)
  //     expect(response.data[1].id).toBe(collections[1].id)
  //   })

  //   it('should change collections order', async () => {
  //     let response = await fetchWithAuth(`/api/collections/moveup/${collections[1].sortIndex}`, 'PUT')
  //     expect(response.status).toBe(200)

  //     response = await fetchWithAuth('/api/collections')
  //     expect(response.status).toBe(200)
  //     expect(response.data?.length).toBe(2)
  //     expect(response.data[0].id).toBe(collections[1].id)
  //     expect(response.data[1].id).toBe(collections[0].id)
  //   })

//   it('should remove collection', async () => {
//     let response = await fetchWithAuth(`/api/collections/${collections[0].id}`, 'DELETE')
//     expect(response.status).toBe(200)
//     response = await fetchWithAuth(`/api/collections/${collections[1].id}`, 'DELETE')
//     expect(response.status).toBe(200)
//   })
})
