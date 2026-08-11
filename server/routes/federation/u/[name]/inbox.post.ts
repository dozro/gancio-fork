import { verifyHTTPSignature } from '~~/server/federation/httpsignature'
import { useLogger } from '~~/server/lib/logger'
import { handleActivity } from '~~/server/federation/handlers'
import { type APActivityBase, APActivityBaseSchema } from '~~/server/federation/types'
import { defineEventHandler, readRawBody, createError, setResponseStatus, setResponseHeader, getHeader, type H3Event } from 'h3'
import { publicSettings } from '~~/server/services'

export async function verifySignature(event: H3Event, rawBody: string, activityData: APActivityBase) {
  // check signature's type
  const sigHeader = getHeader(event, 'signature')
  if (sigHeader === undefined) return

  const signatureInput = getHeader(event, 'signature-input')
  const authorActorId = activityData.actor
  if (!authorActorId) {
    throw createError({ status: 401, message: 'No actor field in body' })
  }

  // draft
  if (sigHeader.includes('(request-target)')) {
    return verifyHTTPSignature(event, rawBody)
  // rfc
  } else if (signatureInput !== undefined) {
    // return verifyRFCSignature(event, rawBody, activityData.actor, !!activityData.proof)
  }
}

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
  const destActorName = event.context?.params?.name
  if (!destActorName) {
    log.info('Invalid /inbox request')
    throw createError({ status: 401, message: 'Invalid actor name' })
  }

  // only the instance shared inbox is supported
  if (destActorName !== publicSettings.instance_name) {
    log.info(`No record found for ${destActorName} (applicationActor is ${publicSettings.instance_name})`)
    throw createError({ status: 404, message: `No actor found for ${destActorName} (applicationActor is ${publicSettings.instance_name})` })
  }

  // read and parse the raw body
  const rawBody = await readRawBody(event)
  if (!rawBody) throw createError({ status: 400, message: 'Empty body' })

  let activity: unknown
  try {
    activity = JSON.parse(rawBody.toString())
  } catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid JSON body' })
  }

  const { success, data: activityData, error } = APActivityBaseSchema.safeParse(activity)
  if (!success || !activityData) {
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

  const activityActor = await verifySignature(event, rawBody, activityData).catch((e) => {
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
