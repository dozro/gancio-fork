import { verifyHTTPSignature } from '~~/server/federation/helpers'
import * as LDSignature from '~~/server/federation/ldsignature'
import { useLogger } from '~~/server/lib/logger'
import { APHandlers } from '~~/server/federation/handlers'
import { APActivityTypeSchema } from '~~/server/federation/types'
import { defineEventHandler, readBody, createError, setResponseStatus, setResponseHeader } from 'h3'
import { getActor } from '~~/server/federation/lookup'

/**
 * Federation route handler for ActivityPub (AP) POST requests to /inbox.
 *
 * This route verifies the HTTP signature, parses the AP message,
 * and dispatches handling logic based on the message type.
 *
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('AP inbox')
  
  const actor = await verifyHTTPSignature(event)
  
  const activity = await readBody(event)

  // has to have an object and a type property..
  if (!activity?.object || !activity?.type) {
    log.warn('activity without `object` or `type` property: %s', activity)
    throw createError({ status: 400, message: 'Wrong AP activity: no object or type property' })
  }
  
  const hasEmbeddedActivity = typeof activity.object === 'object'
  const internalActor = hasEmbeddedActivity ? activity.object.actor : null
  const isDifferentActor = activity.actor !== internalActor
  
  // check ldsignature only for forwarded objects not owned by the sender actor
  if (hasEmbeddedActivity && internalActor && isDifferentActor) {
    if (!activity.object.signature) {
      throw new Error('Forwarded object missing LD signature')
    }
  
    const actor = await getActor(activity.object.actor)
    const publicKey = actor?.object.publicKey
    console.error('publicKey', actor)
    if (!publicKey) {
      throw new Error('Forwarded object actor not found')
    }
    const valid = await LDSignature.verify(activity.object, publicKey)
  
    if (!valid) {
      throw new Error('Invalid LD signature on forwarded object')
    }
  }
  
  const { success, data: type } = APActivityTypeSchema.safeParse(activity.type)
  if (!success) {
    log.warn('unknown activity `type` property: %s', activity.type)
    throw createError({ status: 400, message: 'wrong AP activity type' })
  }
  const handler = APHandlers[type]

  if (!handler) {
    log.error('[FEDI] Unknown activity type: %s', activity.type)
    throw createError({ status: 400, message: 'Unknown activity type' })
  }

  if (actor) {
    try {
      await handler(activity, actor)
    } catch (error) {
      log.error('Error handling activity: %s', error)
      throw createError({ status: 500, message: 'Error handling activity' })
    }
    setResponseStatus(event, 202)
    setResponseHeader(event, 'Content-Type', 'application/activity+json')
  } else if (type === 'Delete') {
    log.warn('Delete without actor could be that the actors does not exists anymore..')
  }
  // switch (message.type) {
  //   case 'Follow':
  //     follow(event, message)
  //     break
  //   case 'Accept':
  //     log.debug('Accept')
  //     return
  //   case 'Undo':
  //     // unfollow || unlike || unboost
  //     if (message.object?.type === 'Follow') {
  //       unfollow(event, message)
  //     } else if (message.object?.type === 'Like') {
  //       // Ego.unbookmark(req, res)
  //     } else if (message.object?.type === 'Announce') {
  //       // Ego.unboost(req, res)
  //     } else {
  //       log.warn('[FEDI] Undo Activity for unsupported Object: %s', JSON.stringify(message.object))
  //       throw createError({ status: 400, message: 'Undo Activity for unsupported Object' })
  //     }
  //     break
  //   case 'Announce':
  //     log.debug(`[FEDI] Announce incoming from ${event.context.fedi_user.ap_id}`)
  //     await parseAPMessage(message, event.context.fedi_user)
  //     return setResponseStatus(event, 201)
  //   case 'Note':
  //     log.debug('[FEDI] Direct Note Activity is not supported: %s', JSON.stringify(message.object))
  //     break
  //   case 'Like':
  //     // Ego.bookmark(req, res)
  //     break
  //   case 'Delete':
  //     if (message.object?.type === 'Tombstone') {
  //       message.object.type = message.object?.formerType ?? 'Tombstone'
  //     }
  //     if (message.object?.type === 'Note') {
  //       // await Resources.remove(req, res)
  //     } else if (message.object?.type === 'Event') {
  //       // await Events.remove(req, res)
  //     } else {
  //       const ap_id = message.object?.id ?? message.object
  //       const ap_actor = await APUser.findOne({ where: { ap_id } })
  //       if (ap_actor) {
  //         // await Users.remove(req, res)
  //       } else {
  //         const resource = await Resource.findOne({ where: { activitypub_id: ap_id } })
  //         if (resource) {
  //           // await Resources.remove(req, res)
  //         }
  //       }
  //     }
  //     break
  //   case 'Update':
  //     if (message.object?.type === 'Event') {
  //       log.debug(`[FEDI] Event update is coming from ${event.context.fedi_user.ap_id}`)
  //       parseAPMessage(message, event.context.fedi_user)
  //     } else if (message.object?.type === 'Note') {
  //       log.debug('[FEDI] Note update is coming from %s', event.context.fedi_user.ap_id)
  //       // await Resources.update(req, res)
  //     } else {
  //       log.debug('[FEDI] Update unsupported Object: %s', JSON.stringify(message?.object))
  //     }
  //     break
  //   case 'Create':
  //     // this is a reply
  //     if (message.object?.type === 'Note') {
  //       // await Resources.create(req, res)
  //     } else if (message.object?.type === 'Event') {
  //       log.debug(`[FEDI] Create Activity with Event type incoming from ${event.context.fedi_user.ap_id}`)
  //       if (!event.context.fedi_user.following || !event.context.fedi_user.trusted) {
  //         log.warn(`[FEDI] APUser not followed or not trusted`)
  //         throw createError({ status: 404, message: 'Not followed or not trusted' })
  //       }
  //       await parseAPMessage(message, event.context.fedi_user)
  //       return setResponseStatus(event, 201)
  //       // return res.status(201).send()
  //     } else {
  //       log.warn('[FEDI] Create unsupported Object => %s', JSON.stringify(message?.object))
  //       throw createError({ status: 404, message: 'Create unsupported Object' })
  //       // return res.sendStatus(404)
  //     }
  //     break
  //   default:
  //     log.error('[FEDI] Unknown message type: %s', message?.type)
  //     throw createError({ status: 404, message: 'Unknown message type' })
  //   // res.sendStatus(404)
  // }
})
