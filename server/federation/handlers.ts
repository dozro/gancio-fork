import { handleFollow, handleUnfollow } from './follows'
import {
  type APActivityDelete, type APActivityCreate, type APActivityUndo,
  type APHandlerMap, type APActivityAnnounce, type APActivity,
  type APActivityUpdate,
  APActivityTypeSchema
} from './types'
import { useLogger } from '../lib/logger'
import { handleCreateEvent, handleUpdateEvent } from './events'

import { APUser, Event, Resource } from '../services/db'
import { handleCreateNote } from './resources'
import { handleLike, handleUnlike } from './ego'

const log = useLogger('APHandlers')
export const APHandlers: APHandlerMap = {
  Follow: handleFollow,
  Undo: handleUndo,
  Create: handleCreate,
  Announce: handleAnnounce,
  Delete: handleDelete,
  Update: handleUpdate,
  Like: handleLike,
  Accept: async () => { }
}

function isActivity(obj: any): obj is APActivity {
  return obj && typeof obj === 'object' && typeof obj.type === 'string'
    && obj.type in APHandlers
}

export async function handleActivity(activity: APActivity, actor?: APUser) {
  // has to have an object and a type property..
  if (!activity?.object || !activity?.type) {
    log.warn('message without `object` or `type` property: %s', activity)
    throw createError({ status: 400, message: 'Wrong AP message: no object or type property' })
  }

  const { success, data: type } = APActivityTypeSchema.safeParse(activity.type)
  if (!success) {
    log.warn('unknown activity `type` property: %s', activity.type)
    throw createError({ status: 400, message: 'wrong AP activity type' })
  }
  const handler = APHandlers[type]

  if (!handler) {
    log.error('[FEDI] Unknown message type: %s', activity.type)
    throw createError({ status: 400, message: 'Unknown message type' })
  }

  return await handler(activity, actor)

}

async function handleUndo(message: APActivityUndo, actor: APUser) {
  const obj = message.object
  if (!obj) return

  switch (obj.type) {
    case 'Follow':
      return handleUnfollow(message, actor)
      // case "Announce":
      //   return handleUnannounce(message, actor)
    case 'Like':
      return handleUnlike(message, actor)
    default:
      log.warn('Undo unsupported object type %s', obj.type)
  }
}

async function handleAnnounce(message: APActivityAnnounce, actor: APUser) {
  const obj = message.object
  if (!obj) return

  if (isActivity(obj)) {
    log.debug(`Announce wrapping ${obj.type}`)
    return handleActivity(obj, actor)
  }
}

async function handleUpdate(message: APActivityUpdate, actor: APUser) {
  const obj = message.object
  if (!obj) return

  if (obj.type === 'Note') {
    log.debug(`Update Activity with Note type incoming from ${actor.ap_id}`)
    log.debug(`Note content: ${JSON.stringify(obj)}`)
    // await Resources.update(req, res)
  } else if (obj.type === 'Event') {
    log.debug(`Update Activity with Event type incoming from ${actor.ap_id}`)
    log.debug(`Event content: ${JSON.stringify(obj)}`)
    return handleUpdateEvent(message, actor)
  }
}

async function handleCreate(message: APActivityCreate, actor: APUser) {
  const obj = message.object

  if (!obj) return
  if (isActivity(obj)) {
    log.debug(`Create wrapping ${obj.type}`)
    return handleActivity(obj, actor)
  }

  // this is a reply
  if (obj.type === 'Note') {
    log.debug(`Create Activity with Note type incoming from ${actor.ap_id}`)
    log.debug(`Note content: ${JSON.stringify(obj)}`)
    await handleCreateNote(obj, actor)
  } else if (obj.type === 'Event') {
    log.debug(`Create Activity with Event type incoming from ${actor.ap_id}`)
    const event = await handleCreateEvent(message, actor)
    log.info(`Created Event ${event.title} / ${event.slug} (id: ${event.id}) - from ${actor.ap_id}`)
  } else {
    log.warn('Create unsupported Object %s => %s', obj?.type, JSON.stringify(obj))
    throw createError({ status: 401, message: 'Create unsupported Object' })
  }
}


// https://www.w3.org/wiki/ActivityPub/Primer/Delete_activity
async function handleDelete(message: APActivityDelete, actor?: APUser) {
  const obj = message.object
  if (!obj) return

  // the id of the resource to delete could be a string or an object with an id property
  const ap_id = (typeof obj === 'string') ? obj : obj.id
  log.debug(`Delete activity object id: ${ap_id}`)
  if (!ap_id) return

  // check if the id to delete is a resource
  const resource = await Resource.findOne({ where: { activitypub_id: ap_id } })
  if (resource) {
    if (actor && actor.ap_id !== resource.apUserApId) return
    log.debug(`Deleting resource ${resource.activitypub_id}`)
    await resource.destroy()
    return
  }

  // or a remote event
  const event = await Event.findOne({ where: { ap_id } })
  if (event) {
    if (actor && actor.ap_id !== event.apUserApId) return
    log.debug(`Deleting event ${event.ap_id}`)
    await event.destroy()
    return
  }

  // or a remote user
  const apUser = await APUser.findOne({ where: { ap_id } })
  if (apUser) {
    if (actor && actor.ap_id !== apUser.ap_id) return
    log.debug(`Deleting APUser ${apUser.ap_id}`)
    await apUser.destroy()
    return
  }
}
