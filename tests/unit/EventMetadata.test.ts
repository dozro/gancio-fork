import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest'
import { mockH3Event, now, loadTestUsers } from './utils'
import { EventMetadata } from '../../server/services'
import { eventToAP, mapEvent, upsertEvent } from '../../server/services/events'
import { Event, Place, Tag } from '../../server/services/db'
import { MAX_METADATA_PER_EVENT, findEventsByMetadata } from '../../server/services/metadata'

import { getUser } from '../../server/lib/getUser'
vi.mock('../../server/lib/getUser')
const mockedGetUser = vi.mocked(getUser)

const { adminUser, editorUser, userUser, anotherUser } = await loadTestUsers()

const { default: getHandler } = await import('../../server/api/events/[id]/metadata/index.get')
const { default: putHandler } = await import('../../server/api/events/[id]/metadata/index.put')
const { default: deleteHandler } = await import('../../server/api/events/[id]/metadata/[key].delete')
const { default: searchHandler } = await import('../../server/api/events/metadata.get')

let eventId: number
let placeId: number

function put(id: number, body: unknown) {
  return putHandler(mockH3Event({ method: 'PUT', params: { id: String(id) }, body }))
}

function get(id: number) {
  return getHandler(mockH3Event({ method: 'GET', params: { id: String(id) } }))
}

describe('Event metadata', () => {
  beforeAll(async () => {
    const { event, place } = await upsertEvent({
      title: 'metadata event', place_name: 'metadata place',
      place_address: 'address', start_datetime: now() + 1000, end_datetime: now() + 2000
    }, userUser)
    eventId = event.id
    placeId = place!.id
  })

  // do not leave the place around for other test files
  afterAll(async () => {
    await Place.destroy({ where: { id: placeId } })
  })

  it('should not allow anonymous users', async () => {
    mockedGetUser.mockResolvedValueOnce(undefined)
    await expect(get(eventId)).rejects.toHaveProperty('statusCode', 401)
    mockedGetUser.mockResolvedValueOnce(undefined)
    await expect(put(eventId, { 'test:uid': 'x' })).rejects.toHaveProperty('statusCode', 401)
  })

  it('should not allow users that cannot modify the event', async () => {
    mockedGetUser.mockResolvedValueOnce(anotherUser)
    await expect(get(eventId)).rejects.toHaveProperty('statusCode', 403)
    mockedGetUser.mockResolvedValueOnce(anotherUser)
    await expect(put(eventId, { 'test:uid': 'x' })).rejects.toHaveProperty('statusCode', 403)
  })

  it('should return 404 for a non existing event', async () => {
    mockedGetUser.mockResolvedValueOnce(adminUser)
    await expect(get(999999)).rejects.toHaveProperty('statusCode', 404)
  })

  it('should set and get metadata as owner', async () => {
    mockedGetUser.mockResolvedValueOnce(userUser)
    const ret = await put(eventId, { 'test:uid': '1234@example.org', 'test:sync': 'pending' })
    expect(ret).toStrictEqual({ 'test:sync': 'pending', 'test:uid': '1234@example.org' })

    mockedGetUser.mockResolvedValueOnce(userUser)
    expect(await get(eventId)).toStrictEqual({ 'test:sync': 'pending', 'test:uid': '1234@example.org' })
  })

  it('should merge, update and remove keys', async () => {
    mockedGetUser.mockResolvedValueOnce(editorUser)
    const ret = await put(eventId, { 'test:sync': 'done', 'test:other': 'value', 'test:uid': null })
    expect(ret).toStrictEqual({ 'test:other': 'value', 'test:sync': 'done' })
  })

  it('should validate payload', async () => {
    const invalidPayloads = [
      { 'invalid key': 'value' },
      { 'test:number': 1 },
      { 'test:object': { a: 1 } },
      { 'test:long': 'x'.repeat(10001) },
      ['test']
    ]
    for (const body of invalidPayloads) {
      mockedGetUser.mockResolvedValueOnce(adminUser)
      await expect(put(eventId, body)).rejects.toHaveProperty('statusCode', 400)
    }
  })

  it('should limit the number of keys per event', async () => {
    const tooMany = Object.fromEntries(Array.from({ length: MAX_METADATA_PER_EVENT + 1 }, (_, i) => [`test:k${i}`, String(i)]))
    mockedGetUser.mockResolvedValueOnce(adminUser)
    await expect(put(eventId, tooMany)).rejects.toHaveProperty('statusCode', 400)

    // nothing should be changed (transaction rollback)
    mockedGetUser.mockResolvedValueOnce(adminUser)
    expect(await get(eventId)).toStrictEqual({ 'test:other': 'value', 'test:sync': 'done' })
  })

  it('should delete a single key', async () => {
    mockedGetUser.mockResolvedValueOnce(userUser)
    const ret = await deleteHandler(mockH3Event({ method: 'DELETE', params: { id: String(eventId), key: 'test:other' } }))
    expect(ret).toStrictEqual({ success: true })

    mockedGetUser.mockResolvedValueOnce(userUser)
    await expect(deleteHandler(mockH3Event({ method: 'DELETE', params: { id: String(eventId), key: 'test:other' } })))
      .rejects.toHaveProperty('statusCode', 404)

    mockedGetUser.mockResolvedValueOnce(userUser)
    expect(await get(eventId)).toStrictEqual({ 'test:sync': 'done' })
  })

  it('should search events by metadata', async () => {
    mockedGetUser.mockResolvedValueOnce(userUser)
    let ret = await searchHandler(mockH3Event({ method: 'GET', query: { key: 'test:sync', value: 'done' } }))
    expect(ret).toStrictEqual([{ eventId, key: 'test:sync', value: 'done' }])

    mockedGetUser.mockResolvedValueOnce(adminUser)
    ret = await searchHandler(mockH3Event({ method: 'GET', query: { key: 'test:sync' } }))
    expect(ret).toStrictEqual([{ eventId, key: 'test:sync', value: 'done' }])

    mockedGetUser.mockResolvedValueOnce(adminUser)
    ret = await searchHandler(mockH3Event({ method: 'GET', query: { key: 'test:sync', value: 'pending' } }))
    expect(ret).toStrictEqual([])

    // users get only metadata of their own events
    mockedGetUser.mockResolvedValueOnce(anotherUser)
    ret = await searchHandler(mockH3Event({ method: 'GET', query: { key: 'test:sync' } }))
    expect(ret).toStrictEqual([])

    mockedGetUser.mockResolvedValueOnce(adminUser)
    await expect(searchHandler(mockH3Event({ method: 'GET', query: {} }))).rejects.toHaveProperty('statusCode', 400)
  })

  it('should not expose metadata in public representations', async () => {
    // even when metadata are loaded they should not be exposed
    const event = await Event.findByPk(eventId, { include: [Tag, Place, 'metadata'] })
    expect(event?.metadata?.length).toBeGreaterThan(0)
    expect(JSON.stringify(mapEvent(event!))).not.toContain('test:sync')
    expect(JSON.stringify(eventToAP(event!))).not.toContain('test:sync')
  })

  it('should remove metadata when the event is removed', async () => {
    const event = await Event.findByPk(eventId)
    await event!.destroy()
    expect(await EventMetadata.count({ where: { eventId } })).toBe(0)
    expect(await findEventsByMetadata('test:sync')).toStrictEqual([])
  })
})
