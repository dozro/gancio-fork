import { parseAPMessage, verifySignature } from '~~/server/federation/helpers'
import { follow, unfollow } from "~~/server/federation/follows"

/**
 * Federation route handler for ActivityPub (AP) POST requests to /inbox.
 *
 * This route verifies the HTTP signature, parses the AP message,
 * and dispatches handling logic based on the message type.
 *
 */
 
export default defineEventHandler(async event => {
  const log = useLogger('AP inbox')
  await verifySignature(event)
  const message = await readBody(event)
  console.error('message:', message)
  
  // has to have an object and a type property..
  if (!message?.object || !message?.type) {
    log.warn('[FEDI] message without `object` or `type` property: %s', message)
    throw createError({ status: 404, message: 'Wrong AP message: no object or type property' })
  }

  setHeader(event, 'Content-Type', 'application/activity+json')
  log.debug('[FEDI] Type %s', message.type)
  switch (message.type) {
    case 'Follow':
      follow(event, message)
      break
    case 'Accept':
      log.debug('Accept')
      return
    case 'Undo':
      // unfollow || unlike || unboost
      if (message.object?.type === 'Follow') {
        unfollow(event, message)
      } else if (message.object?.type === 'Like') {
        // Ego.unbookmark(req, res)
      } else if (message.object?.type === 'Announce') {
        // Ego.unboost(req, res)
      } else {
        log.warn('[FEDI] Undo Activity for unsupported Object: %s', JSON.stringify(message.object))
        throw createError({ status: 400, message: 'Undo Activity for unsupported Object'})
      }
      break
    case 'Announce':
      log.debug(`[FEDI] Announce incoming from ${event.context.fedi_user.ap_id}`)
      await parseAPMessage(message, event.context.fedi_user)
      return setResponseStatus(event, 201)
      // return res.status(201).send()
    case 'Note':
      log.debug('[FEDI] Direct Note Activity is not supported: %s', JSON.stringify(message.object))
      break
    case 'Like':
      // Ego.bookmark(req, res)
      break
    case 'Delete':
      if (message.object?.type === 'Tombstone') {
        message.object.type = message.object?.formerType ?? 'Tombstone'
      }
      if (message.object?.type === 'Note') {
        // await Resources.remove(req, res)
      } else if (message.object?.type === 'Event') {
        // await Events.remove(req, res)
      } else {
        const ap_id = message.object?.id ?? message.object
        const ap_actor = await APUser.findOne({ where: { ap_id } })
        if (ap_actor) {
          // await Users.remove(req, res)
        } else {
          const resource = await Resource.findOne({ where: { activitypub_id: ap_id } })
          if (resource) {
            // await Resources.remove(req, res)
          }
        }
      }
      break
    case 'Update':
      if (message.object?.type === 'Event') {
        log.debug(`[FEDI] Event update is coming from ${res.locals.fedi_user.ap_id}`)
        // await Events.update(req, res)
      } else if (message.object?.type === 'Note') {
        log.debug('[FEDI] Note update is coming from %s', res.locals.fedi_user.ap_id)
        // await Resources.update(req, res)
      } else {
        log.debug('[FEDI] Update unsupported Object: %s', JSON.stringify(message?.object))
      }
      break
    case 'Create':
      // this is a reply
      if (message.object?.type === 'Note') {
        // await Resources.create(req, res)
      } else if (message.object?.type === 'Event') {
        log.debug(`[FEDI] Create Activity with Event type incoming from ${res.locals.fedi_user.ap_id}`)
        if (!res.locals.fedi_user.following || !res.locals.fedi_user.trusted) {
          log.warn(`[FEDI] APUser not followed or not trusted`)
          throw createError({ status: 404, message: 'Not followed or not trusted' })
        }
        await parseAPMessage(message, event.context.fedi_user)
        return setResponseStatus(event, 201)
        // return res.status(201).send()
      } else {
        log.warn('[FEDI] Create unsupported Object => %s', JSON.stringify(message?.object))
        throw createError({ status: 404, message: 'Create unsupported Object' })
        // return res.sendStatus(404)
      }
      break
    default:
      log.error('[FEDI] Unknown message type: %s', message?.type)
      throw createError({ status: 404, message: 'Unknown message type'})
      // res.sendStatus(404)
  }
})