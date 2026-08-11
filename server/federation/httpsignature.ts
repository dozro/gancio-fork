import crypto from 'crypto'
import { publicSettings } from '../services/settings'
import { type H3Event, getHeader, createError } from 'h3'
import type { APActivityBase } from './types'
import { useLogger } from '../lib/logger'
import { getActorFromKeyId } from './lookup'
import type { APUser } from '../services'
import { decodeStructuredField } from './http_dict'
import { parseHttpKeyValueHeader } from '../lib/http'
const log = useLogger('HTTPSignature')

/**
 * https://swicg.github.io/activitypub-http-signature/#how-to-sign-a-request
 */
export function prepareHTTPSignature(
  rawBody: string,
  targetUrl: string,
  method: 'post' | 'get' = 'post',
  privkey: string,
  keyId: string = `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}#main-key`
) {
  const inboxUrl = new URL(targetUrl)
  const signer = crypto.createSign('sha256')
  const date = new Date().toUTCString()
  const pathName = inboxUrl.pathname
  const hostname = inboxUrl.hostname
  let header
  let digest
  let stringToSign
  if (method === 'post') {
    digest = crypto.createHash('sha256')
      .update(rawBody)
      .digest('base64')
    stringToSign = `(request-target): post ${pathName}\nhost: ${inboxUrl.hostname}\ndate: ${date}\ndigest: SHA-256=${digest}`
    const signature = signer.update(stringToSign).end().sign(privkey).toString('base64')
    header = `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date digest",signature="${signature}"`
  } else {
    stringToSign = `(request-target): get ${pathName}\nhost: ${hostname}\ndate: ${date}`
    const signature = signer.update(stringToSign).end().sign(privkey).toString('base64')
    header = `keyId="${keyId}",algorithm="rsa-sha256",headers="(request-target) host date",signature="${signature}"`
  }

  return {
    host: inboxUrl.hostname,
    date,
    signature: header,
    ...(method === 'post' && ({ digest: `SHA-256=${digest}` }))
  }
}

/**
 * Verifies the HTTP signature of an incoming request.
 * https://www.w3.org/wiki/SocialCG/ActivityPub/Authentication_Authorization#Signing_requests_using_HTTP_Signatures
 * Each POST to /inbox coming from fediverse has to be verified.
 * Signature checking needs Actor's public key
 * @return APUser that signed the request in case of successfull validation
 * @throws {H3Error} throw in case of validation failure
 */
export async function verifyHTTPSignature(
  event: H3Event,
  rawBody: string
): Promise<APUser | undefined> {
  const requiredSigned = ['(request-target)', 'host', 'date']

  const signatureHeader = getHeader(event, 'signature')
  if (!signatureHeader) {
    throw createError({ status: 401, message: 'Missing signature header' })
  }
  const date = getHeader(event, 'date')
  if (!date) {
    throw createError({ status: 401, message: 'Missing date header' })
  }

  const parsedSignature = parseHttpKeyValueHeader(signatureHeader)
  if (!parsedSignature.get('keyId')) {
    throw createError({ status: 401, message: 'Missing keyId in signature header' })
  }

  if (!['rsa-sha256', 'hs2019'].includes(parsedSignature.get('algorithm') ?? '')) {
    throw createError('Only RSA-SHA256 (HS2019) is supported')
  }

  const signedDate = new Date(date).getTime()
  const receivedTime = Date.now()
  if (signedDate < receivedTime - 60 * 60 * 1000 || signedDate > receivedTime + 60 * 60 * 1000) {
    throw createError('Signature no longer valid in time (expired)')
  }
  const signedHeaderKeys = (parsedSignature.get('headers') ?? '').split(' ')
  if (requiredSigned.some(key => !signedHeaderKeys.includes(key))) {
    throw createError('Some required headers aren\'t signed')
  }

  //  check digest header
  const digest = crypto.createHash('sha256')
    .update(rawBody)
    .digest('base64')

  const signature = getHeader(event, 'digest')
  const prefix = 'sha-256='
  if (!signature?.toLowerCase().startsWith(prefix)) {
    log.warn(`Unsupported digest algorithm: ${signature}`)
    throw createError({ status: 400, message: 'Unsupported digest algorithm' })
  }

  const value = signature.slice(prefix.length)
  if (value !== digest) {
    log.warn(`Signature mismatch ${value} - ${digest}`)
    throw createError({ status: 401, message: 'Signature mismatch' })
  }

  const signedHeaders = signedHeaderKeys.map(key => {
    switch (key) {
      case '(request-target)':
        return `${key}: ${event.method.toLowerCase()} ${event.path}`
      case 'host':
        return `${key}: ${event.node.req.headers.host}`
      default:
        return `${key}: ${event.headers.get(key)}`
    }
  }).join('\n')

  // get signer public key
  const signingKeyId = parsedSignature.get('keyId')
  if (!signingKeyId) {
    throw createError('Missing signing actor URL in keyId')
  }

  let signedActor = await getActorFromKeyId(signingKeyId)
  log.debug(`Verifying signature from ${signingKeyId} (actor ${signedActor?.ap_id})`)
  const publicKeyPem = signedActor?.object?.publicKey?.publicKeyPem
  if (!publicKeyPem) {
    throw createError(`Signing actor has no public key ${signingKeyId}`)
  }

  let publicKey = crypto.createPublicKey(publicKeyPem)
  const sig = Buffer.from(parsedSignature.get('signature') ?? '', 'base64')
  const verify = crypto.createVerify('sha256')
  verify.update(signedHeaders)
  if (!verify.verify(publicKey, sig)) {
    signedActor = await getActorFromKeyId(signingKeyId)
    const publicKeyPem = signedActor?.object?.publicKey?.publicKeyPem
    if (!publicKeyPem) {
      throw createError('Signing actor has no public key')
    }
    publicKey = crypto.createPublicKey(publicKeyPem)
    if (!verify.verify(publicKey, sig)) {
      throw createError('Mismatched signature')
    }
  }

  return signedActor
  // if (isValid) {
  //   log.debug(`Valid signature from ${actor_url} `)
  //   return ap_actor
  // }

  // // signature not valid, try get the actor again skipping the cache
  // ap_actor = await getActor(actor_url, true)
  // if (!ap_actor) {
  //   log.info(`Actor ${actor_url} not found`)
  //   throw createError({ status: 401, message: 'Actor not found' })
  // }

  // if (!ap_actor?.object?.publicKey?.publicKeyPem) {
  //   log.info(`Actor %s has no publicKey at %s`, ap_actor.ap_id, actor_url)
  //   throw createError({ status: 401, message: 'No public key' })
  // }

  // if (httpSignature.verifySignature(parsed, ap_actor.object.publicKey.publicKeyPem)) {
  //   log.debug(`Valid signature from ${actor_url} `)
  //   return ap_actor
  // }

  // // still not valid
  // log.info(`Invalid signature from Actor ${actor_url} - ${parsed}`)
  // throw createError({ status: 401, message: 'Request signature could not be verified' })
  //
  // // get the actor
  // const actor_url = body?.actor

  // log.debug('Verify Signature ', actor_url)

  // // do we have an actor?
  // if (!actor_url) {
  //   log.warn(`[FEDI] Verify Signature: No actor url or empty body`)
  //   throw createError({ status: 401, message: `No actor field in body` })
  // }

  // // get actor
  // let ap_actor = await getActor(actor_url, false)
  // if (!ap_actor) {
  //   log.info(`Actor ${actor_url} not found`)
  //   throw createError({ status: 401, message: 'Actor not found' })
  // }

  // // Is this instance blocked?
  // if (ap_actor.instance?.blocked) {
  //   log.warn(`Instance ${ap_actor.instance.domain} blocked`)
  //   throw createError({ status: 401, message: 'Instance blocked' })
  // }

  // if (ap_actor.blocked) {
  //   log.info(`Actor ${ap_actor.ap_id} blocked`)
  //   throw createError({ status: 401, message: 'Actor blocked' })
  // }

  // if (!ap_actor?.object?.publicKey?.publicKeyPem) {
  //   log.info(`Actor %s has no publicKey at %s`, ap_actor.ap_id, actor_url)
  //   throw createError({ status: 401, message: 'No public key' })
  // }

  // if (parsed.keyId !== ap_actor.object.publicKey?.id) {
  //   log.warn(`keyId mismatch: ${parsed.keyId} !== ${ap_actor.object.publicKey?.id}`)
  //   throw createError({ status: 401, message: 'keyId mismatch' })
  // }publicSettings

  // const isValid = httpSignature.verifySignature(parsed, ap_actor.object.publicKey.publicKeyPem)
}

export async function prepareRFCSignature(_message: string, _actor: APUser, _keyId: string) {

}

/**
 * Verify a RFC 9421 signature
 */
export async function verifyRFCSignature(event: H3Event, _rawBody: string, _activityData: APActivityBase): Promise<APUser | undefined> {
  const signatureInput = getHeader(event, 'signature-input')
  if (signatureInput === undefined) return
  const input = decodeStructuredField(signatureInput.toString())

  // each key in the input & sig is a signature. find one we have a key for!
  const sigKeys = [...input.keys()]
    .map(key => input.get(key)?.params?.get('keyid')?.toString())
    .filter(Boolean)
  if (sigKeys.length == 0) return

  // use the first key we already have locally, or if we have none, fetch the first one
  // const keyId = sigKeys.find(id => app.db.actor.getActorByAnyKeyId(id) !== undefined) ?? sigKeys[0]!

  // const actors = await getAndCheckActors(app, authorActorId, keyId, alternateSignerIds, hasProof);
  // if (actors === undefined) return "invalid";
  // const { signingActor, authorActor: _ } = actors;
  // const keys = signingActor.record.assertionMethod ?? [];
  // if (signingActor.record.publicKey !== undefined) {
  //   const oldPk = signingActor.record.publicKey;
  //   if (oldPk.publicKeyPem !== undefined) {
  //     keys.push(await getPublicMultiKeyFromPem(oldPk.owner, oldPk.id, "rsa", oldPk.publicKeyPem));
  //   }
  // }

  // // in fastify: request.url == metadata.target, "host" header is set by nginx, "x-forwarded-proto" is scheme
  // const metadata: HttpRequestMetadata = {
  //   method: request.method,
  //   scheme: request.headers["x-forwarded-proto"]?.toString() ?? "https",
  //   host: request.headers["host"] ?? app.config.domain,
  //   target: request.url,
  // };

  // try {
  //   await checkHttpRfc(metadata, request.headers, (request.rawBody ?? "") as string, keys);
  // } catch (error) {
  //   if (error instanceof Error) {
  //     app.log.info(`Discarding request from ${signingActor.id}: bad HTTP RFC signature: ${error.message}`);
  //   }
  //   app.events.add(
  //     "bad-signature",
  //     { severity: EventSeverity.Error, actor: signingActor.id, target: authorActorId, reason: "rfc-signature" },
  //   );
  //   return "invalid";
  // }

  // app.log.info(`WHOA we got an RFC 9421 signature!!!`);
  // return signingActor;
}