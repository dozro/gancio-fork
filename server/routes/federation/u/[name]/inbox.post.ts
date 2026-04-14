import { verifyHTTPSignature } from '~~/server/federation/httpsignature'
// import * as LDSignature from '~~/server/federation/ldsignature'
import { useLogger } from '~~/server/lib/logger'
import { handleActivity } from '~~/server/federation/handlers'
import { APActivityBaseSchema } from '~~/server/federation/types'
import { defineEventHandler, readRawBody, createError, setResponseStatus, setResponseHeader } from 'h3'
import { publicSettings } from '~~/server/services'

/**
 * Federation route handler for ActivityPub (AP) POST requests to /inbox.
 *
 * This route verifies the HTTP signature, parses the AP message,
 * and dispatches handling logic based on the message type.
 *
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('AP inbox')

  // check destination inbox
  const actorName = event.context?.params?.name
  if (!actorName) {
    log.info('Invalid /inbox request')
    throw createError({ status: 401, message: 'Invalid actor name' })
  }

  // only the instance shared inbox is supported
  if (actorName !== publicSettings.instance_name) {
    log.info(`No record found for ${actorName} (applicationActor is ${publicSettings.instance_name})`)
    throw createError({ status: 404, message: `No actor found for ${actorName} (applicationActor is ${publicSettings.instance_name})` })
  }

  // read and parse the raw body
  const rawBody = await readRawBody(event)
  if (!rawBody) throw createError({ status: 400, message: 'Empty body' })

  const activity = JSON.parse(rawBody.toString())
  const { success, data: activityData, error } = APActivityBaseSchema.safeParse(activity)
  if (!success) {
    log.warn('Wrong AP activity: %s', error.issues[0]?.message)
    log.debug(activity)
    return
  }

  // this verifies who sent the activity
  // object and a type property are required
  // if (!activity?.object || !activity?.type) {
  //   log.warn('activity without `object` or `type` property: %s', activity)
  //   throw createError({ status: 400, message: 'Wrong AP activity: no object or type property' })
  // }

  // authorship check is required for forwarded objects not owned by the sender actor
  // const hasEmbeddedObject = typeof activity.object === 'object'
  // const internalActor = hasEmbeddedObject ? activity.object?.attributedTo : null
  // const isDifferentActor = activityActor.ap_id !== internalActor
  // const hasToCheckAuthorship = hasEmbeddedObject && internalActor && isDifferentActor
  // if (hasToCheckAuthorship) {
  //   if (!activity.object.signature) {
  //     throw new Error('Forwarded object missing LD signature')
  //   }

  //   const actor = await getActor(internalActor)
  //   const publicKey = actor?.object.publicKey
  //   if (!publicKey) {
  //     throw new Error('Forwarded object actor not found')
  //   }
  //   const valid = await LDSignature.verify(activity.object, publicKey.publicKeyPem)

  //   if (!valid) {
  //     throw new Error('Invalid LD signature on forwarded object')
  //   }
  // }

  const activityActor = await verifyHTTPSignature(event, rawBody, activityData).catch(e => {
    log.info(e)
    throw e
  })
  if (!activityActor) return false
  try {
    await handleActivity(activity, activityActor)
  } catch (error) {
    log.error('Error handling activity: %s', error)
    throw createError({ status: 500, message: 'Error handling activity' })
  }

  setResponseStatus(event, 202)
  setResponseHeader(event, 'Content-Type', 'application/activity+json')
})
