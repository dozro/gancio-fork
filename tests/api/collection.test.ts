import { beforeAll, describe, expect, it } from 'vitest'
import { $fetchRaw as fetch } from 'nitro-test-utils/e2e'
import { fetchWithAuth, now, cleanDatabase } from './setup'

const collections = []
const filters = []
describe('Collection', async () => {
  beforeAll(async () => {
    await cleanDatabase(true)
  })
  it('should not create a new collection if not allowed', async () => {
    const response = await fetch('/api/collections', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' })

    })
    expect(response.status).toBe(401)
  })

  it('should create a new collection', async () => {
    const response = await fetchWithAuth('/api/collections', 'POST', { name: 'test' })
    expect(response.status).toBe(200)

    expect(response.data.id).toBeDefined()
    collections.push(response.data)
  })

  it('should not have any event when no filters', async () => {
    const response = await fetch('/api/collections/test')

    expect(response.status).toBe(200)
    expect(response.data.length).toBe(0)
  })

  it('should add a new filter (tag: test) only when allowed', async () => {
    let response = await fetchWithAuth('/api/filters', 'POST', { collectionId: collections[0].id, tags: ['test'] }, 'none')
    expect(response.status).toBe(401)

    response = await fetchWithAuth('/api/filters', 'POST', { collectionId: collections[0].id, tags: ['test'] })

    expect(response.status).toBe(200)

    expect(response.data.id).toBeDefined()
    filters.push(response.data.id)
  })

  it('shoud get collection\'s filters using withFilters parameter', async () => {
    let response = await fetchWithAuth('/api/collections?withFilters=true')

    expect(response.status).toBe(200)
    expect(response.data.length).toBe(1)
    expect(response.data[0].name).toBe('test')
    expect(response.data[0].filters.length).toBe(1)
    expect(response.data[0].filters[0].tags.length).toBe(1)
    expect(response.data[0].filters[0].tags[0]).toBe('test')

    response = await fetchWithAuth('/api/collections')
    expect(response.status).toBe(200)
    expect(response.data[0]?.filters).toBeUndefined()

    response = await fetchWithAuth('/api/collections?withFilters=false')
    expect(response.status).toBe(200)
    expect(response.data[0]?.filters).toBeUndefined()
  })

  it('should get collection events', async () => {
    const response = await fetch(`/api/collections/test`)
    expect(response.status).toBe(200)

    // expect(await response.json()).toBe(1)
  })

  // it('should remove filter', async () => {
  //   await request(app)
  //     .delete(`/api/filter/${filters[0]}`)
  //     .expect(403)

  // await request(app)
  //   .delete(`/api/filter/${filters[0]}`)
  //   .auth(token.access_token, { type: 'bearer' })
  //   .expect(200)

  // const response = await request(app)
  //   .get(`/api/filter/${filters[0]}`)
  //   .auth(token.access_token, { type: 'bearer' })
  //   .expect(200)

  //   expect(response.body.length).toBe(0)
  // })

  // it('shoud filter for tags', async () => {
  //
  // })
  //

  it('should create a second collection', async () => {
    let response = await fetchWithAuth('/api/collections', 'POST', { name: 'second collection' })
    expect(response.status).toBe(200)
    expect(response.data.id).toBeDefined()
    collections.push(response.data)

    response = await fetchWithAuth('/api/collections')
    expect(response.status).toBe(200)
    expect(response.data?.length).toBe(2)
    expect(response.data[0].id).toBe(collections[0].id)
    expect(response.data[1].id).toBe(collections[1].id)
  })

  it('should change collections order', async () => {
    let response = await fetchWithAuth(`/api/collections/moveup/${collections[1].sortIndex}`, 'PUT')
    expect(response.status).toBe(200)

    response = await fetchWithAuth('/api/collections')
    expect(response.status).toBe(200)
    expect(response.data?.length).toBe(2)
    expect(response.data[0].id).toBe(collections[1].id)
    expect(response.data[1].id).toBe(collections[0].id)
  })

  it('should remove collection', async () => {
    let response = await fetchWithAuth(`/api/collections/${collections[0].id}`, 'DELETE')
    expect(response.status).toBe(200)
    response = await fetchWithAuth(`/api/collections/${collections[1].id}`, 'DELETE')
    expect(response.status).toBe(200)
  })
})
