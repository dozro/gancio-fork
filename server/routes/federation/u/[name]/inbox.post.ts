import { verifyHTTPSignature } from '~~/server/federation/httpsignature'
import { verifyRFCSignature } from '~~/server/federation/rfcsignature'
import { useLogger } from '~~/server/lib/logger'
import { handleActivity } from '~~/server/federation/handlers'
import { type APActivityBase, APActivityBaseSchema, type APProof } from '~~/server/federation/types'
import { defineEventHandler, readRawBody, createError, setResponseStatus, setResponseHeader, getHeader, type H3Event } from 'h3'
import { publicSettings } from '~~/server/services'
import { verifyProof } from '~~/server/federation/object_integrity_proof'

export async function verifySignature(event: H3Event, rawBody: string, activityData: APActivityBase) {
  const log = useLogger('AP Verify Signature')
  // check signature's type
  const sigHeader = getHeader(event, 'signature')
  if (sigHeader === undefined) return

  const signatureInput = getHeader(event, 'signature-input')
  const authorActorId = activityData.actor
  if (!authorActorId) {
    log.warn('No actor field in body')
    throw createError({ status: 401, message: 'No actor field in body' })
  }

  // draft
  if (sigHeader.includes('(request-target)')) {
    log.warn('Found HTTP cavage signature')
    return verifyHTTPSignature(event, rawBody)
  // rfc
  } else if (signatureInput !== undefined) {
    log.warn('Check for RFC Signature')
    return verifyRFCSignature(event, rawBody)
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
    log.debug(error)
    return
  }

  const activityActor = await verifySignature(event, rawBody, activityData).catch((e) => {
    log.info(e)
    throw e
  })

  const proofActor = activityData.proof && await verifyProof(activity as { proof: APProof, signature?: object }).catch((e) => {
    log.info(e)
    throw e
  })

  if (!activityActor) {
    log.warn('No valid signature')
    throw createError({ status: 401 })
  }

  log.info(`Incoming AP activity actor: %s, proof actor: %s`, activityActor.ap_id, proofActor)
  try {
    await handleActivity(activityData, activityActor, proofActor)
  } catch (error) {
    log.error('Error handling activity: %s', error)
    throw createError({ status: 500, message: 'Error handling activity' })
  }

  setResponseStatus(event, 202)
  setResponseHeader(event, 'Content-Type', 'application/activity+json')
})
