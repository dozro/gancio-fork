import crypto from 'crypto'
import httpSignature from '@peertube/http-signature'
import { DateTime } from 'luxon'
import { readBody, readRawBody, createError, getHeader } from 'h3'
import { _signAndSend } from './sign_and_send'
import { useLogger } from '../lib/logger'
import { useTaskManager } from '../services/taskManager'
import { publicSettings, secretSettings } from '../services'
import { APUser } from '../services/db'
import { eventToAP } from '../services/events'
import type { H3Event } from 'h3'
import { APActivityTypeSchema } from './types'
import { handleActivity } from './handlers'
import { getActor, getInstance } from './lookup'
import emitter from '../lib/emitter'

const log = useLogger('federation')

// ignore unimplemented ping url from fediverse
export async function signAndSend(message: string, inbox: string, method = 'post') {
  useTaskManager().add({
    name: 'SIGN_AND_SEND',
    method: _signAndSend,
    args: [message, inbox, method, secretSettings.privateKey]
  })
}

function _getUser() {
  const name = publicSettings?.instance_name ?? publicSettings.title
  const baseurl = publicSettings.baseurl
  return {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/security/v1',
      {
        toot: 'http://joinmastodon.org/ns#',

        // A property-value pair, e.g. representing a feature of a product or place. We use this to publish this very same instance
        // https://docs.joinmastodon.org/spec/activitypub/#PropertyValue
        schema: 'http://schema.org#',
        ProperyValue: 'schema:PropertyValue',
        value: 'schema:value',

        // https://docs.joinmastodon.org/spec/activitypub/#discoverable
        discoverable: 'toot:discoverable',

        indexable: 'toot:indexable'
      }
    ],
    'id': `${baseurl}/federation/u/${name}`,
    'type': 'Application',
    'name': publicSettings.title,
    'preferredUsername': name,
    'inbox': `${baseurl}/federation/u/${name}/inbox`,
    'outbox': `${baseurl}/federation/u/${name}/outbox`,
    'manuallyApprovesFollowers': false,
    'endpoints': { sharedInbox: `${baseurl}/federation/u/${name}/inbox` },
    'discoverable': true,
    'indexable': true,
    'attachment': [
      {
        type: 'PropertyValue',
        name: 'Website',
        value: `<a href='${baseurl}'>${baseurl}</a>`
      }
    ],
    'icon': {
      type: 'Image',
      mediaType: 'image/png',
      url: baseurl + '/logo.png'
    },
    'summary': publicSettings.description,
    'publicKey': {
      id: `${baseurl}/federation/u/${name}#main-key`,
      owner: `${baseurl}/federation/u/${name}`,
      publicKeyPem: publicSettings.publicKey
    },
    'url': `${baseurl}/federation/u/${name}`
  }
}

emitter.on('settings:updated', ({ key, value }: { key: keyof Settings; value: unknown }) => {
  // when changing this we have to update the actor
  if (['description', 'logo'].includes(key)) {
    updateActor()
  }
})
export async function updateActor() {
  if (!publicSettings.enable_federation) {
    log.info('[FEDI] Federation is disabled')
    return
  }

  const followers = await APUser.findAll({ where: { follower: true } })
  log.debug('[FEDI] Sending to %d followers: [%s]', followers.length, followers.map(f => f.ap_id).join(', '))
  const recipients = {}
  followers.forEach((follower) => {
    const sharedInbox = follower?.object?.endpoints?.sharedInbox ?? follower?.object?.inbox
    if (!recipients[sharedInbox]) {
      recipients[sharedInbox] = []
    }
    recipients[sharedInbox].push(follower.ap_id)
  })

  for (const sharedInbox in recipients) {
    log.debug(`Notify ${sharedInbox} with actor update cc => ${recipients[sharedInbox].length}`)
    const body = {
      id: `${publicSettings.baseurl}/federation/m/actor#update-${DateTime.local().toMillis()}`,
      type: 'Update',
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: [...recipients[sharedInbox], `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}/followers`],
      actor: `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}`,
      object: _getUser()
    }

    body['@context'] = body['object']['@context']

    signAndSend(JSON.stringify(body), sharedInbox)
  }
}

export async function getFollowersInbox() {
  const followers = await APUser.findAll({ where: { follower: true } })

  const recipients: Record<string, string[]> = {}
  for (const follower of followers) {
    const inbox = follower?.object?.endpoints?.sharedInbox ?? follower?.object?.inbox
    if (!inbox) continue
    if (!recipients[inbox]) recipients[inbox] = []
    recipients[inbox].push(follower.ap_id)
  }

  return recipients
}

export const APContext = [
  'https://www.w3.org/ns/activitystreams',
  'https://w3id.org/security/v1',
  {
    toot: 'http://joinmastodon.org/ns#',

    // https://docs.joinmastodon.org/spec/activitypub/#Hashtag
    Hashtag: 'https://www.w3.org/ns/activitystreams#Hashtag',

    manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',

    // focal point - https://docs.joinmastodon.org/spec/activitypub/#focalPoint
    focalPoint: {
      '@container': '@list',
      '@id': 'toot:focalPoint'
    }
  }
]

export async function announceEvent(event) {
  if (!publicSettings.enable_federation) {
    log.info('[FEDI] Event not sent, federation is disabled')
    return
  }

  const recipients = await getFollowersInbox()
  for (const sharedInbox in recipients) {
    log.debug(`Announce ${sharedInbox} with event ${event.title} cc => ${recipients[sharedInbox].length}`)
    const body = {
      '@context': APContext,
      'id': `${publicSettings.baseurl}/federation/m/${event.id}#Announce-${Date.now()}`,
      'type': 'Announce',
      'actor': `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}`,
      'to': ['https://www.w3.org/ns/activitystreams#Public'],
      'cc': [...recipients[sharedInbox], `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}/followers`],
      'object': eventToAP(event) // event?.ap_id ?? event.id // Must point to the original object's ID
    }
    signAndSend(JSON.stringify(body), sharedInbox)
  }
}

export async function parseAPMessage(APMessage, actor) {
  log.info('Parsing message from %s', actor?.ap_id ?? actor)
  if (APMessage.type === 'Announce' || APMessage.type === 'Create') {
    if (!APMessage?.object || !APMessage?.type) {
      log.warn('[FEDI] message without `object` or `type` property: %s', APMessage)
      throw new Error('message without `object` or `type` property')
    }
    log.debug(`[FEDI] Parsing ${APMessage.type}`)
    return parseAPMessage(APMessage?.object, actor)
  }

  let event
  if (typeof APMessage === 'string') {
    const is_local = APMessage?.match(`${publicSettings.baseurl}/federation/m/(.*)`)
    // Announce of local event
    if (is_local) {
      log.debug(`[FEDI] Announce of local event ${APMessage}, skip parsing`)
      return false
      // return Ego.boost(APMessage, actor)
    }
  } else if (APMessage.type === 'Event') {
    event = APMessage
  } else {
    log.warn(`[FEDI] Skip AP object of type: ${APMessage.type}`)
    return false
  }

  if (!actor.following || !actor.trusted) {
    log.warn(`[FEDI] APUser not followed or not trusted`)
    return false
  }

  try {
    let tmp_actor
    if (!event) {
      // this is an announce of a remote event, let's get the event
      log.debug(`[FEDI] Fetch remote Event from ${APMessage}`)
      event = await _signAndSend('', APMessage, 'get', secretSettings.privateKey)
    }
    if (event?.type === 'Event') {
      if (event?.attributedTo !== actor?.ap_id) {
        log.warn(`[FEDI] Event attributedTo Actor is different from Activity Actor ${event?.attributedTo} !== ${actor?.ap_id}, keep going as I trust and follow ${actor?.ap_id}`)
        const instance = await getInstance(event?.attributedTo)
        tmp_actor = await getActor(event?.attributedTo, instance)
      }
      return parseAPEvent(event, tmp_actor ?? actor)
    } else {
      log.debug(`[FEDI] Skip AP object of type ${event?.type}`)
      return false
    }
  } catch (e) {
    log.error('[FEDI] Error getting remote AP Event (%s): %s', APMessage, e?.message ?? e)
    throw new Error('Error getting remote AP Event')
  }
}

export async function followActor(actor: APUser) {
  log.debug(`[FEDI] Following actor ${actor.ap_id}`)
  const body = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': `${publicSettings.baseurl}/federation/m/${actor.ap_id}#follow`,
    'type': 'Follow',
    'actor': `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}`,
    'object': actor.ap_id
  }

  await signAndSend(JSON.stringify(body), actor.object.endpoints?.sharedInbox ?? actor.object.inbox)
  await actor.update({ following: true })

  log.info('After actor update following, get the outbox')
  // let's try to get remote outbox
  const activities = await getOutbox(actor)
  if (!activities?.length) {
    log.debug('[FEDI] No outbox activities for %s', actor.ap_id)
    return
  }

  log.info('Found some activities in outbox', activities.length)

  for (const activity of activities) {
    log.debug('Handle outbox activity %s from %s', activity.type, actor.ap_id)
    log.debug('Activity content: %s', JSON.stringify(activity, null, 2))
    const { success } = APActivityTypeSchema.safeParse(activity.type)
    if (!success) {
      log.warn('unknown activity `type` property: %s', activity.type)
      continue
    }

    await handleActivity(activity, actor).catch((err) => {
      log.error('Error handling activity %s from %s', activity.type, actor.ap_id)
      log.error(err)
    })
  }
}

export async function getOutbox(actor: APUser) {
  log.debug('[FEDI] Get %s outbox: %s', actor?.ap_id, actor?.object?.outbox)

  if (!actor?.object?.outbox) return
  try {
    const collection = await _signAndSend('', actor?.object?.outbox, 'get', secretSettings.privateKey)
    // embedded collection
    if (typeof collection?.first !== 'string') {
      return collection?.first?.orderedItems ?? []
    } else if (isUrl(collection?.first)) {
      return getOutboxPaginated(collection?.first)
    }
  } catch (e) {
    log.warn('[FEDI] getOutbox %s failed: %s', actor.ap_id, e)
    return []
  }
}

async function getOutboxPaginated<Outbox = unknown>(
  initialUrl: string,
  {
    maxSoftLimit = 50,
    maxPages = 5
  } = {}
) {
  let outbox: Outbox[] = []

  let nextPageUrl = initialUrl
  let thereIsMoreContent = true
  let pageCount = 0

  // Always get at least the first page, independently of the "soft limit"
  do {
    const collection = await _signAndSend('', nextPageUrl, 'get', secretSettings.privateKey)
    thereIsMoreContent = false
    if (Array.isArray(collection?.orderedItems) && collection.orderedItems.length) {
      outbox = [...outbox, ...collection.orderedItems]
      if (isUrl(collection.next) && collection.next !== nextPageUrl) {
        thereIsMoreContent = true
        nextPageUrl = collection.next
      }
    }
    pageCount++
  } while (thereIsMoreContent && outbox.length < maxSoftLimit && pageCount < maxPages)
  return outbox
}

const isUrl = (url: unknown) => typeof url === 'string' && /^https?:\/\//.test(url)

export async function unfollowActor(actor: APUser) {
  log.debug(`[FEDI] Unfollowing actor ${actor.ap_id}`)

  const object = {
    id: `${publicSettings.baseurl}/federation/m/${actor.ap_id}#follow`,
    type: 'Follow',
    object: actor.ap_id
  }

  const body = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': `${publicSettings.baseurl}/federation/m/${actor.ap_id}#unfollow`,
    'type': 'Undo',
    'actor': `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}`,
    object
  }
  await signAndSend(JSON.stringify(body), actor.object.endpoints?.sharedInbox || actor.object.inbox)
  return actor.update({ following: false })
}

/**
   * HTTP Signature middleware
   * https://www.w3.org/wiki/SocialCG/ActivityPub/Authentication_Authorization#Signing_requests_using_HTTP_Signatures
   * Each POST to /inbox coming from fediverse has to be verified.
   * Signature checking needs Actor's public key
   * @return APUser in case of successfull validation
   * @throws {H3Error} throw in case of validation failure
   */
export async function verifySignature(event: H3Event) {
  const name = event.context?.params?.name
  const body = await readBody(event)
  const actor_url = body?.actor
  const isDelete = body?.type === 'Delete'
  const settings = publicSettings

  log.debug('Verify Signature ', name, actor_url)
  if (!name) {
    log.info('[AP] Bad /inbox request')
    throw createError({ status: 400, message: 'Bad request' })
  }

  if (name !== settings.instance_name) {
    log.info(`[FEDI] No record found for ${name} (applicationActor is ${settings.instance_name})`)
    throw createError({ status: 404, message: `No actor found for ${name} (applicationActor is ${settings.instance_name})` })
  }

  // do we have an actor?
  if (!actor_url) {
    log.warn(`[FEDI] Verify Signature: No actor url or empty body`)
    throw createError({ status: 401, message: `Actor not found` })
  }

  // Get instance's nodeinfo
  // getting this from db if it is not the first time we interact with it
  const instance = await getInstance(actor_url, false, isDelete)
  if (!instance) {
    log.warn(`[FEDI] Verify Signature: Instance not found ${actor_url}`)
    if (isDelete) {
      return false
    }
    throw createError({ status: 401, message: 'Instance not found' })
  }

  // Is this instance blocked?
  if (instance.blocked) {
    log.warn(`[FEDI] Instance ${instance.domain} blocked`)
    throw createError({ status: 401, message: 'Instance blocked' })
  }

  // get actor
  let ap_actor = await getActor(actor_url, instance, false, isDelete)
  if (!ap_actor) {
    log.info(`[FEDI] Actor ${actor_url} not found`)
    if (isDelete) {
      return false
    }
    throw createError({ status: 401, message: 'Actor not found' })
  }

  if (ap_actor.blocked) {
    log.info(`[FEDI] Actor ${ap_actor.ap_id} blocked`)
    throw createError({ status: 401, message: 'Actor blocked' })
  }

  if (!ap_actor?.object?.publicKey?.publicKeyPem) {
    log.info(`[FEDI] Actor %s has no publicKey at %s`, ap_actor.ap_id, actor_url)
    throw createError({ status: 401, message: 'No public key' })
  }

  // check Digest
  const rawBody = await readRawBody(event)
  const digest = crypto.createHash('sha256')
    .update(rawBody)
    .digest('base64')
  const signature = getHeader(event, 'Digest')
  if (`SHA-256=${digest}` !== signature) {
    log.warn(`Signature mismatch ${signature} - ${digest}`)
    throw createError({ status: 401, message: 'Signature mismatch' })
  }

  const parsed = httpSignature.parseRequest(event.node.req)
  if (!parsed.keyId) {
    log.warn(`[FEDI] Missing keyId in signature from ${actor_url}`)
    throw createError({ status: 401, message: 'Missing keyId in signature' })
  }
  
  if (parsed.keyId !== ap_actor.object.publicKey.id) {
    log.warn(`[FEDI] keyId mismatch: ${parsed.keyId} !== ${ap_actor.object.publicKey.id}`)
    throw createError({ status: 401, message: 'keyId mismatch' })
  }
  
  if (httpSignature.verifySignature(parsed, ap_actor.object.publicKey.publicKeyPem)) {
    log.debug(`[FEDI] Valid signature from ${actor_url} `)
    return ap_actor
  }

  // signature not valid, try without cache
  ap_actor = await getActor(actor_url, instance, true)
  if (!ap_actor) {
    log.info(`[FEDI] Actor ${actor_url} not found`)
    throw createError({ status: 401, message: 'Actor not found' })
  }

  if (!ap_actor?.object?.publicKey?.publicKeyPem) {
    log.info(`[FEDI] Actor %s has no publicKey at %s`, ap_actor.ap_id, actor_url)
    throw createError({ status: 401, message: 'No public key' })
  }

  if (httpSignature.verifySignature(parsed, ap_actor.object.publicKey.publicKeyPem)) {
    log.debug(`[FEDI] Valid signature from ${actor_url} `)
    return ap_actor
  }

  // still not valid
  log.info(`[FEDI] Invalid signature from Actor ${actor_url} - ${parsed}`)
  throw createError({ status: 401, message: 'Request signature could not be verified' })
}
