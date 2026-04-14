import { describe, expect, it } from 'vitest'
import { handleActivity } from '../../server/federation/handlers'
import { getActor, getInstance } from '../../server/federation/lookup'
import { connect, Event, Instance, Resource, APUser, runMigrations } from '../../server/services/db'
import { loadSettings, setSetting } from '../../server/services/settings'

// SETUP
const db = await connect()
await runMigrations()
await loadSettings()
await db.query('DELETE FROM events')
await db.query('DELETE FROM resources')
await db.query('DELETE FROM instances')
await db.query('DELETE FROM ap_users')
await Instance.create({
  domain: 'localhost:13120',
  applicationActor: 'http://localhost:13120/federation/u/relay',
  name: 'Test Instance',
  blocked: false,
  data: ''
})

await APUser.create({
  ap_id: 'http://localhost:13120/federation/u/relay',
  instanceDomain: 'localhost:13120',
  object: {
    id: 'http://localhost:13120/federation/u/relay',
    type: 'Person',
    inbox: 'http://localhost:13120/federation/u/relay/inbox',
    outbox: 'http://localhost:13120/federation/u/relay/outbox',
    icon: {
      type: 'Image',
      mediaType: 'image/png',
      url: 'http://localhost:13120/federation/u/relay/avatar.png'
    }
  }
})

const instance = await getInstance('http://localhost:13120', false)

if (!instance) throw new Error('Instance not found')
const actor = await getActor('http://localhost:13120/federation/u/relay', false)
if (!actor) throw new Error('Actor not found')
await actor.update({ trusted: true, following: true })

describe('AP Activity handler', () => {
  it('should handle a Create > Event activity from a trusted actor', async () => {
    const { default: event } = await import('../fixtures/APActivities/0-CreateEvent')
    await handleActivity(event, actor)

    const ev = await Event.findOne({ where: { ap_id: event.object.id } })
    expect(ev).toBeDefined()
    expect(ev.title).toBe('Create > Event')
  })

  it('should not handle a Create > Event activity from an untrusted or not following actor (adversarial)', async () => {
    const { default: event } = await import('../fixtures/APActivities/0-CreateEvent')
    await actor.update({ trusted: false })
    await expect(handleActivity(event, actor))
      .rejects.toThrow('Not followed or not trusted')

    await actor.update({ trusted: true, following: false })
    await expect(handleActivity(event, actor))
      .rejects.toThrow('Not followed or not trusted')

    await actor.update({ trusted: true, following: true })
  })

  it('should handle an Update > Event activity', async () => {
    const { default: event } = await import('../fixtures/APActivities/1-UpdateEvent')
    await handleActivity(event, actor)
    const ev = await Event.findOne({ where: { ap_id: event.object.id } })
    expect(ev).toBeDefined()
    expect(ev.title).toBe('Update > Event')
  })

  it('should fail an Update > Event from different actor (adversarial)', async () => {
    const { default: event } = await import('../fixtures/APActivities/1-UpdateEvent')
    const ret = handleActivity(event, { ...actor, ap_id: 'different_actor_id' })
    return expect(ret).rejects.toThrow('Event actor is not the original event actor')
  })

  it('should fail an Update > Event on non existing event (adversarial)', async () => {
    const { default: event } = await import('../fixtures/APActivities/1-UpdateEvent')
    const ret = handleActivity({ ...event, object: { ...event.object, id: 'non_existing_event' } }, actor)
    return expect(ret).rejects.toThrow('Event non_existing_event not found')
  })

  it('should fail to handle a Create > Note when remote resources are not enabled (adversarial)', async () => {
    await setSetting('enable_resources', false)
    const { default: event } = await import('../fixtures/APActivities/2-CreateNote')
    const ret = handleActivity(event, actor)
    return expect(ret).rejects.toThrow('Note are disabled')
  })

  it('should handle a Create > Note to an existing event', async () => {
    await setSetting('enable_resources', true)
    const { default: activity } = await import('../fixtures/APActivities/2-CreateNote')
    await handleActivity(activity, actor)
    const note = await Resource.findOne({ where: { activitypub_id: activity.object.id } })
    expect(note).toBeDefined()
    expect(note.data.name).toBe('Create > Note')
  })

  it('should fail to handle a Create > Note to a non existing event (adversarial)', async () => {
    await setSetting('enable_resources', true)
    const { default: activity } = await import('../fixtures/APActivities/2-CreateNote')
    const ret = handleActivity({ ...activity, object: { ...activity.object, inReplyTo: 'http://localhost:13120/event/123' } }, actor)
    return expect(ret).rejects.toThrow('Not found')
  })

  it('should not handle a Delete > Note with different actor (adversarial)', async () => {
    const { default: activity } = await import('../fixtures/APActivities/3-DeleteNote')
    // achttp://localhost:13120/federation/u/relay
    await handleActivity(activity, { ...actor, ap_id: 'http://localhost:13120/federation/u/different_actor' })
    const note = await Resource.findOne({ where: { activitypub_id: activity.object.id } })
    expect(note.data.name).toBe('Create > Note')
  })

  it('should handle a Delete > Note', async () => {
    const { default: activity } = await import('../fixtures/APActivities/3-DeleteNote')
    await handleActivity(activity, actor)
    const note = await Resource.findOne({ where: { activitypub_id: activity.object.id } })
    expect(note).toBeNull()
  })

  it('should handle a Delete > Note with id as the object', async () => {
    const { default: createNote } = await import('../fixtures/APActivities/2-CreateNote')
    await handleActivity(createNote, actor)
    const { default: activity } = await import('../fixtures/APActivities/4-DeleteIdOnlyNote')
    await handleActivity(activity, actor)
    const note = await Resource.findOne({ where: { activitypub_id: activity.object } })
    expect(note).toBeNull()
  })

  it('should handle Follow', async () => {
    const { default: activity } = await import('../fixtures/APActivities/5-Follow')
    await handleActivity(activity, actor)
    const user = await APUser.findOne({ where: { ap_id: activity.object } })
    expect(user).not.toBeNull()
    expect(user.follower).toBeTruthy()
  })

  it('should handle Undo > Follow', async () => {
    const { default: activity } = await import('../fixtures/APActivities/6-UndoFollow')
    await handleActivity(activity, actor)
    const user = await APUser.findOne({ where: { ap_id: activity.object.object } })
    expect(user).not.toBeNull()
    expect(user.follower).toBeFalsy()
  })

  // (e.g. the trusted source is a mastodon actor that Boost an event)
  it('should handle an Announce > Create > Event', async () => {
    const { default: activity } = await import('../fixtures/APActivities/7-AnnounceCreateEvent')
    await handleActivity(activity, actor)
    const ev = await Event.findOne({ where: { ap_id: activity.object.object.id } })
    expect(ev).toBeDefined()
    expect(ev.title).toBe('Announce > Create > Event')
  })

  it('should handle Like > Event', async () => {
    const { default: activity } = await import('../fixtures/APActivities/8-LikeEvent')
    await handleActivity(activity, actor)
    const event = await Event.findOne({ where: { ap_id: activity.object } })
    expect(event.likes.length).toBe(1)
    expect(event.likes).toStrictEqual(['http://localhost:13120/federation/u/relay'])
  })

  it('should handle Undo > Like', async () => {
    const { default: activity } = await import('../fixtures/APActivities/9-UndoLikeEvent')
    await handleActivity(activity, actor)
    const event = await Event.findOne({ where: { ap_id: activity.object.object } })
    expect(event.likes.length).toBe(0)
  })

  it('should handle a Delete > Event', async () => {
    const { default: activity } = await import('../fixtures/APActivities/10-DeleteEvent')
    await handleActivity(activity, actor)
    const event = await Event.findOne({ where: { ap_id: activity.object } })
    expect(event).toBeNull()
  })

  it('should handle a Delete > Event with non existing event (adversarial)', async () => {
    const { default: activity } = await import('../fixtures/APActivities/10-DeleteEvent')
    const ret = handleActivity({ ...activity, object: 'non_existing_event' }, actor)
    return expect(ret).resolves.toBeUndefined()
  })

  it('should be idempotent on duplicate Create (adversarial)', async () => {
    const { default: event } = await import('../fixtures/APActivities/0-CreateEvent')

    await handleActivity(event, actor)
    await handleActivity(event, actor)

    const events = await Event.findAll({ where: { ap_id: event.object.id } })
    expect(events.length).toBe(1)
  })

  it('should be idempotent on duplicate Delete (adversarial)', async () => {
    // const { default: createEvent } = await import('../fixtures/APActivities/0-CreateEvent')
    const { default: deleteEvent } = await import('../fixtures/APActivities/10-DeleteEvent')

    // await handleActivity(createEvent, actor)
    let events = await Event.findAll({ where: { ap_id: deleteEvent.object } })
    expect(events.length).toBe(1)
    await handleActivity(deleteEvent, actor)
    await handleActivity(deleteEvent, actor)

    events = await Event.findAll({ where: { ap_id: deleteEvent.object } })
    expect(events.length).toBe(0)
  })

  it('should be idempotent on duplicate Like (adversarial)', async () => {
    const { default: createEvent } = await import('../fixtures/APActivities/0-CreateEvent')
    await handleActivity(createEvent, actor)
    const { default: like } = await import('../fixtures/APActivities/8-LikeEvent')
    await handleActivity(like, actor)
    await handleActivity(like, actor)
    const event = await Event.findOne({ where: { ap_id: like.object } })
    expect(event.likes.length).toBe(1)
  })

  it('should be idempotent duplicate on Follow (adversarial)', async () => {
    const { default: follow } = await import('../fixtures/APActivities/5-Follow')
    await handleActivity(follow, actor)
    await handleActivity(follow, actor)
    const user = await APUser.findAll({ where: { follower: true } })
    expect(user.length).toBe(1)
  })
})