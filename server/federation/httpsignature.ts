import crypto from 'crypto'
import { publicSettings } from '../services/settings'
import { type H3Event, getHeader, createError } from 'h3'
import type { APActivityBase } from './types'
import { useLogger } from '../lib/logger'
import { getActor } from './lookup'
import httpSignature from '@peertube/http-signature'
const log = useLogger('HTTPSignature')

export async function prepareHTTPSignature(message: string, inbox: string, method: 'post' | 'get' = 'post', privkey: string) {
  const inboxUrl = new URL(inbox)
  const signer = crypto.createSign('sha256')
  const d = new Date()

  let header
  let digest
  if (method === 'post') {
    digest = crypto.createHash('sha256')
      .update(message)
      .digest('base64')
    const stringToSign = `(request-target): post ${inboxUrl.pathname}\nhost: ${inboxUrl.hostname}\ndate: ${d.toUTCString()}\ndigest: SHA-256=${digest}`
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(privkey)
    const signature_b64 = signature.toString('base64')
    header = `keyId="${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}#main-key",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature_b64}"`
  } else {
    const stringToSign = `(request-target): get ${inboxUrl.pathname}\nhost: ${inboxUrl.hostname}\ndate: ${d.toUTCString()}`
    signer.update(stringToSign)
    signer.end()
    const signature = signer.sign(privkey)
    const signature_b64 = signature.toString('base64')
    header = `keyId="${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}#main-key",algorithm="rsa-sha256",headers="(request-target) host date",signature="${signature_b64}"`
  }

  return {
    host: inboxUrl.hostname,
    date: d.toUTCString(),
    signature: header,
    ...(method === 'post' && ({ digest: `SHA-256=${digest}` }))
  }
}

/**
 * Verifies the HTTP signature of an incoming request.
 * https://www.w3.org/wiki/SocialCG/ActivityPub/Authentication_Authorization#Signing_requests_using_HTTP_Signatures
 * Each POST to /inbox coming from fediverse has to be verified.
 * Signature checking needs Actor's public key
 * @return APUser in case of successfull validation
 * @throws {H3Error} throw in case of validation failure
 */
export async function verifyHTTPSignature(event: H3Event, rawBody: string, body: APActivityBase) {
  const signatureHeader = getHeader(event, 'signature')
  if (!signatureHeader) {
    throw createError({ status: 401, message: 'Missing signature header' })
  }
  const parsed = httpSignature.parseRequest(event.node.req)

  if (!parsed.keyId) {
    throw createError({ status: 401, message: 'Missing keyId in signature header' })
  }

  // get the actor
  const actor_url = body?.actor

  log.debug('Verify Signature ', actor_url)

  // do we have an actor?
  if (!actor_url) {
    log.warn(`[FEDI] Verify Signature: No actor url or empty body`)
    throw createError({ status: 401, message: `No actor field in body` })
  }

  // get actor
  let ap_actor = await getActor(actor_url, false)
  if (!ap_actor) {
    log.info(`Actor ${actor_url} not found`)
    throw createError({ status: 401, message: 'Actor not found' })
  }

  // Is this instance blocked?
  if (ap_actor.instance?.blocked) {
    log.warn(`Instance ${ap_actor.instance.domain} blocked`)
    throw createError({ status: 401, message: 'Instance blocked' })
  }

  if (ap_actor.blocked) {
    log.info(`Actor ${ap_actor.ap_id} blocked`)
    throw createError({ status: 401, message: 'Actor blocked' })
  }

  if (!ap_actor?.object?.publicKey?.publicKeyPem) {
    log.info(`Actor %s has no publicKey at %s`, ap_actor.ap_id, actor_url)
    throw createError({ status: 401, message: 'No public key' })
  }

  if (parsed.keyId !== ap_actor.object.publicKey?.id) {
    log.warn(`keyId mismatch: ${parsed.keyId} !== ${ap_actor.object.publicKey?.id}`)
    throw createError({ status: 401, message: 'keyId mismatch' })
  }

  const isValid = httpSignature.verifySignature(parsed, ap_actor.object.publicKey.publicKeyPem)

  //  check digest header
  const digest = crypto.createHash('sha256')
    .update(rawBody)
    .digest('base64')

  const signature = getHeader(event, 'digest')
  const prefix = 'sha-256='
  // some software use uppsercase SHA-256 to indicate the algo
  if (!signature?.toLowerCase().startsWith(prefix)) {
    log.warn(`Unsupported digest algorithm: ${signature}`)
    throw createError({ status: 400, message: 'Unsupported digest algorithm' })
  }

  const value = signature.slice(prefix.length)
  if (value !== digest) {
    log.warn(`Signature mismatch ${value} - ${digest}`)
    throw createError({ status: 401, message: 'Signature mismatch' })
  }

  if (isValid) {
    log.debug(`Valid signature from ${actor_url} `)
    return ap_actor
  }

  // signature not valid, try get the actor again skipping the cache
  ap_actor = await getActor(actor_url, true)
  if (!ap_actor) {
    log.info(`Actor ${actor_url} not found`)
    throw createError({ status: 401, message: 'Actor not found' })
  }

  if (!ap_actor?.object?.publicKey?.publicKeyPem) {
    log.info(`Actor %s has no publicKey at %s`, ap_actor.ap_id, actor_url)
    throw createError({ status: 401, message: 'No public key' })
  }

  if (httpSignature.verifySignature(parsed, ap_actor.object.publicKey.publicKeyPem)) {
    log.debug(`Valid signature from ${actor_url} `)
    return ap_actor
  }

  // still not valid
  log.info(`Invalid signature from Actor ${actor_url} - ${parsed}`)
  throw createError({ status: 401, message: 'Request signature could not be verified' })
}