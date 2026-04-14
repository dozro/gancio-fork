import { handleFollow, handleUnfollow } from './follows'
import type {
  APActivityDelete, APActivityCreate, APActivityUndo,
  APHandlerMap, APActivityAnnounce, APActivity,
  APActivityUpdate,
  APActivityTypeSchema,
  APActivityBase,
  APEvent,
  APNote
} from './types'
import { useLogger } from '../lib/logger'
import { handleCreateEvent, handleUpdateEvent } from './events'

import { APUser, Event, Resource } from '../services/db'
import { handleCreateNote } from './resources'
import { handleLike, handleUnlike } from './ego'
import { createError } from 'h3'
import { _signAndSend } from './sign_and_send'
import { secretSettings } from '../services'
import { verify } from './ldsignature'
import { getActor } from './lookup'

const log = useLogger('APHandlers')

export const APHandlers: APHandlerMap = {
  Create: handleCreate,
  Undo: handleUndo,
  Update: handleUpdate,
  Delete: handleDelete,
  Follow: handleFollow,
  Announce: handleAnnounce,
  Like: handleLike,
  Accept: async () => { }
}

export function isAPActivity(obj: any): obj is APActivity {
  return obj &&
    typeof obj === 'object' &&
    typeof obj.type === 'string' &&
    obj.type in APHandlers &&
    obj.object
}

/**
 * Handles an incoming AP activity by looking up the appropriate handler for the activity type
 */
export async function handleActivity(activity: APActivityBase, activityActor?: APUser) {
  if (!isAPActivity(activity)) {
    log.info('activity with wrong `type` or `object` property: %s', activity.type)
    return null
  }

  // has to have an object and a type property..
  if (!activity?.object) {
    log.warn('message without `object` or `type` property: %s', activity)
    return null
  }

  const { success, data: type } = APActivityTypeSchema.safeParse(activity.type)
  if (!success) {
    log.warn('unknown activity `type` property: %s', activity.type)
    return null
  }
  const handler = APHandlers[type]

  return await handler(activity, activityActor)
}

async function handleUndo(message: APActivityUndo, activityActor: APUser) {
  const obj = message.object
  if (!obj) return

  switch (obj.type) {
    case 'Follow':
      return handleUnfollow(message, activityActor)
    case 'Announce':
      return handleUnannounce(message, activityActor)
    case 'Like':
      return handleUnlike(message, activityActor)
    default:
      log.warn('Undo unsupported object type %s', obj.type)
  }
}

/**
 * incoming Announce activity (e.g. Event from trusted source)
 */
async function handleAnnounce(message: APActivityAnnounce, activityActor: APUser) {
  log.info('dentro announce')
  let obj: string | APEvent | APNote = message.object
  let verified = false
  if (typeof obj === 'string') {
    log.info(`Announce object is a string: `, obj)
    obj = await _signAndSend('', obj, 'get', secretSettings.privateKey) as APEvent | APNote
    verified = true
  }
  if (!obj) return

  if (isAPActivity(obj)) {
    log.debug(`Ignoring Announce wrapping ${obj.type}`)
    return handleActivity(obj, activityActor)
    // throw createError({ status: 200, message: `Announce wrapping ${obj.type} is not supported` })
  }

  if (!obj.attributedTo) return

  const actor = await getActor(obj?.attributedTo)
  if (activityActor.trusted && !activityActor.blocked && !verified) {
    // verify message authorship
    if (obj.signature && actor) {
      verified = await verify(obj, actor?.object.publicKey?.publicKeyPem)
    }
  }
  if (verified) {
    handleCreate({ type: 'Create', object: obj }, activityActor)
  }
}

async function handleUnannounce(message, activityActor) {
  log.info(`Undo Announce message: `, message.id)
}

async function handleUpdate(message: APActivityUpdate, activityActor: APUser) {
  const obj = message.object
  if (!obj) return

  if (obj.type === 'Note') {
    log.debug(`Update Activity with Note type incoming from ${activityActor.ap_id}`)
    log.debug(`Note content: ${JSON.stringify(obj)}`)
    // await Resources.update(req, res)
  } else if (obj.type === 'Event') {
    log.debug(`Update Activity with Event type incoming from ${activityActor.ap_id}`)
    log.debug(`Event content: ${JSON.stringify(obj)}`)
    return handleUpdateEvent(message, activityActor)
  }
}

async function handleCreate(message: APActivityCreate, actor: APUser) {
  const obj = message.object
  if (!obj) return

  // check if author is the same as the actor
  // if (!obj.attributedTo || obj.attributedTo !== actor.ap_id) {
  //   log.warn(`Create Activity with different actor: ${obj.attributedTo} !== ${actor.ap_id}`)
  //   throw createError({ status: 401, message: 'Create with different actor' })
  // }

  // an incoming Note could be a reply
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
    throw createError({ status: 200, message: 'Create unsupported Object' })
  }
}

// https://www.w3.org/wiki/ActivityPub/Primer/Delete_activity
async function handleDelete(message: APActivityDelete, activityActor?: APUser) {
  const obj = message.object
  if (!obj) return

  // the id of the resource to delete could be a string or an object with an id property
  const ap_id = (typeof obj === 'string') ? obj : obj.id
  log.debug(`Delete activity object id: ${ap_id}`)
  if (!ap_id) return

  // check if the id to delete is a resource
  const resource = await Resource.findOne({ where: { activitypub_id: ap_id } })
  if (resource) {
    if (activityActor && activityActor.ap_id !== resource.apUserApId) return
    log.debug(`Deleting resource ${resource.activitypub_id}`)
    await resource.destroy()
    return
  }

  // or a remote event
  const event = await Event.findOne({ where: { ap_id } })
  if (event) {
    if (activityActor && activityActor.ap_id !== event.apUserApId) return
    log.debug(`Deleting event ${event.ap_id}`)
    await event.destroy()
    return
  }

  // or a remote user
  const apUser = await APUser.findOne({ where: { ap_id } })
  if (apUser) {
    if (activityActor && activityActor.ap_id !== apUser.ap_id) return
    log.debug(`Deleting APUser ${apUser.ap_id}`)
    await apUser.destroy()
    return
  }
}
