import crypto from 'crypto'
import httpSignature from '@peertube/http-signature'
import { DateTime } from 'luxon'

import { parseAPLocation } from './places'
import { getImageFromURL, sanitizeHTML } from '../helpers'
import { findOrCreateTags } from '../lib/tags'

  const log = useLogger('federation')
  
  // ignore unimplemented ping url from fediverse
  export function spamFilter (req, res, next) {
    const urlToIgnore = [
      '/api/v1/instance',
      '/api/meta',
      '/api/statusnet/version.json',
      '/api/gnusocial/version.json',
      '/api/statusnet/config.json',
      '/status.php',
      '/siteinfo.json',
      '/friendika/json',
      '/friendica/json',
      '/poco'
    ]
    if (urlToIgnore.includes(req.path)) {
      log.debug(`[FEDI] Ignore noisy fediverse ${req.path}`)
      return res.status(404).send('Not Found')
    }
    next()
  }

  export async function signAndSend (message, inbox, method='post') {
    useTaskManager().add({
      name: 'SIGN_AND_SEND',
      method: _signAndSend,
      args: [message, inbox, method]
    })
  }

  function _getUser () {
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
      id: `${baseurl}/federation/u/${name}`,
      type: 'Application',
      name: publicSettings.title,
      preferredUsername: name,
      inbox: `${baseurl}/federation/u/${name}/inbox`,
      outbox: `${baseurl}/federation/u/${name}/outbox`,
      manuallyApprovesFollowers: false,
      endpoints: { sharedInbox: `${baseurl}/federation/u/${name}/inbox` },
      discoverable: true,
      indexable: true,
      attachment: [
        {
          type: 'PropertyValue',
          name: 'Website',
          value: `<a href='${baseurl}'>${baseurl}</a>`
        }
      ],
      icon: {
        type: 'Image',
        mediaType: 'image/png',
        url: baseurl + '/logo.png'
      },
      summary: publicSettings.description,
      publicKey: {
        id: `${baseurl}/federation/u/${name}#main-key`,
        owner: `${baseurl}/federation/u/${name}`,
        publicKeyPem: publicSettings.publicKey
      },
      url: `${baseurl}/federation/u/${name}`
    }    
  }
  
export async function updateActor() {
  if (!publicSettings.enable_federation) {
    log.info('[FEDI] Federation is disabled')
    return
  }

  const followers = await APUser.findAll({ where: { follower: true } })
  log.debug("[FEDI] Sending to %d followers: [%s]", followers.length, followers.map(f => f.ap_id).join(', '))
  const recipients = {}
  followers.forEach(follower => {
    const sharedInbox = follower?.object?.endpoints?.sharedInbox ?? follower?.object?.inbox
    if (!recipients[sharedInbox]) { recipients[sharedInbox] = [] }
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
  
  async function _signAndSend (message, inbox, method='post') {
    // log.debug('[FEDI] Sign and %s %s %s', method, message, inbox)
    log.debug('[FEDI] Sign and %s %s', method, inbox)
    const inboxUrl = new URL(inbox)
    const privkey = secretSettings.privateKey
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
    try {
      const ret = await fetch(inbox, {
        headers: {
          Host: inboxUrl.hostname,
          Date: d.toUTCString(),
          Signature: header,
          ...(method === 'post' && ({ Digest: `SHA-256=${digest}` })),
          'Content-Type': 'application/activity+json',
          Accept: 'application/activity+json'
        },
        method,
        ...( method === 'post' && ({ body: message }))
      })
      
      const contentType = ret.headers.get('content-type')
      // check if content-type is json
      if (!contentType.includes('json')) {
        log.error(`[FEDI] Error in sign and send, wrong content-type returned: ${contentType} - status: ${ret.status}`)
        console.error(await ret.text())
        return
      }
      
      if (ret.ok) {
        log.debug(`[FEDI] Signed and verified! ${ret.status} => ${contentType}`)
        return ret.json().catch(e => '')
      } else {
        const body = await ret.json()
        log.error("[FEDI] Error in sign and send [%s]: %s", inbox, body)
        throw body
      }
      
    } catch (e) {
      log.error("[FEDI] Error in sign and send [%s]: %s", inbox, e?.response?.data?.error ?? e?.response?.statusMessage ?? '' + ' ' + String(e))
      throw e
    }
  }

  export async function sendEvent (event, type = 'Create') {
    if (!publicSettings.enable_federation) {
      log.info('[FEDI] Event not sent, federation is disabled')
      return
    }

    const followers = await APUser.findAll({ where: { follower: true } })
    log.debug("[FEDI] Sending to %d followers: [%s]", followers.length, followers.map(f => f.ap_id).join(', '))
    const recipients = {}
    followers.forEach(follower => {
      const sharedInbox = follower?.object?.endpoints?.sharedInbox ?? follower?.object?.inbox
      if (!recipients[sharedInbox]) { recipients[sharedInbox] = [] }
      recipients[sharedInbox].push(follower.ap_id)
    })

    for (const sharedInbox in recipients) {
      log.debug(`Notify ${sharedInbox} with event ${event.title} cc => ${recipients[sharedInbox].length}`)
      const body = {
        id: `${publicSettings.baseurl}/federation/m/${event.id}#${type}-${event.updatedAt.getTime()}`,
        type,
        to: ['https://www.w3.org/ns/activitystreams#Public'],
        cc: [...recipients[sharedInbox], `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}/followers`],
        actor: `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}`,
        object: event.toAP(recipients[sharedInbox], type)
      }

      body['@context'] = [
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
          "discoverable": "toot:discoverable",

          // https://docs.joinmastodon.org/spec/activitypub/#Hashtag
          "Hashtag": "https://www.w3.org/ns/activitystreams#Hashtag",

          manuallyApprovesFollowers: 'as:manuallyApprovesFollowers',

          // focal point - https://docs.joinmastodon.org/spec/activitypub/#focalPoint
          "focalPoint": {
            "@container": "@list",
            "@id": "toot:focalPoint"
          }
        }]

        signAndSend(JSON.stringify(body), sharedInbox)
    }
  }

  export async function parseAPMessage (APMessage, actor) {
    
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
        // this is an announce of a remote event, let's get the actor
        event = await _signAndSend('', APMessage, 'get')
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
      throw new Error("Error getting remote AP Event")
    }
  }
  
  /**
   *  Event object.type
   */
  export async function parseAPEvent (APEvent, actor) {
      // const tagController = require('../api/controller/tag')

      if (APEvent?.type !== 'Event') {
        log.warn(`[FEDI] parseAPEvent with another object type ${APEvent.type}`)
        throw createError({ status: 400, message: `Wrong object type: ${APEvent.type}` })
      }

      // validate incoming events
      const required_fields = ['name', 'startTime', 'id', 'type']
      let missing_field = required_fields.find(required_field => !APEvent[required_field])
      if (missing_field) {
        log.warn(`[FEDI] ${missing_field} required`)
        throw createError({ status: 400, message: `${missing_field} required` })
      }

      // check if this event is in the past
      if (DateTime.fromISO(APEvent.startTime) < DateTime.now()) {
        log.warn(`[FEDI] Event startTime is in the past: ${APEvent.startTime}`)
        throw createError({ status: 400, message: 'Event startTime is in the past' })
      }

      // check if this event is already added
      const ap_id = APEvent.id
      const exists = await Event.findOne({ where: { ap_id }})
      if (exists) {
        log.warn(`[FEDI] Avoid creating a duplicated event ${ap_id} - ${publicSettings.baseurl}/event/${exists.slug}`)
        return exists
      }
  
      const [ place, online_locations ] = await parseAPLocation(APEvent)
  
      let media = []
      const image_url = APEvent?.attachment?.find(a => a?.mediaType.includes('image') && a.url)?.url
      if (image_url) {
  
        log.debug('[FEDI] Download attachment for event %s', image_url)
        const file = await getImageFromURL(image_url)
  
        media = [{
          url: file.filename,
          height: file.height,
          width: file.width,
          name: APEvent.attachment[0]?.name || APEvent.name.trim() || '',
          size: file.size || 0,
          focalpoint: APEvent.attachment[0]?.focalPoint
        }]
      }
  
      // create it
      const event = await Event.create({
        title: APEvent?.name?.trim() ?? '',
        start_datetime: DateTime.fromISO(APEvent.startTime).toUnixInteger(),
        end_datetime: APEvent?.endTime ? DateTime.fromISO(APEvent.endTime).toUnixInteger() : null,
        description: sanitizeHTML(APEvent?.content ?? APEvent?.summary ?? ''),
        online_locations,
        media,
        is_visible: true,
        ap_id,
        ap_object: APEvent, 
        apUserApId: actor?.ap_id ?? actor,
      })
  
      if (place) {
        await event.setPlace(place)
      }
  
      // create/assign tags
      if (APEvent.tag) {
        log.warn('TODO: APEvent with tags!')
        const tags = await findOrCreateTags(APEvent.tag.map(t => t?.name?.replace('#', '')))
        await event.setTags(tags)
      }
      log.debug(`[FEDI] Event created: ${publicSettings.baseurl}/event/${event.slug}`)
      return event
  }

  export async function followActor (actor) {
    log.debug(`[FEDI] Following actor ${actor.ap_id}`)
    const body = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${publicSettings.baseurl}/federation/m/${actor.ap_id}#follow`,
      type: 'Follow',
      actor: `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}`,
      object: actor.ap_id
    }

    await signAndSend(JSON.stringify(body), actor.object.endpoints?.sharedInbox ?? actor.object.inbox)
    await actor.update({ following: true })

    log.info('After actor update follogin, get the outbox')
    // let's try to get remote outbox
    const events = await getOutbox(actor, 10)
    if (!events?.length) {
      log.debug('[FEDI] No outbox events for %s', actor.ap_id)
      return
    }
    
    log.info('Found some events in outbox', events.length)
    for(const event of events) {
      await parseAPMessage(event, actor).catch(e => log.warn(e))
    }
  }

  export async function getOutbox(actor, limit) {
    log.debug('[FEDI] Get %s outbox: %s', actor?.ap_id, actor?.object?.outbox)
    
    if (!actor?.object?.outbox) return
    try {
      let collection = await _signAndSend('', actor?.object?.outbox, 'get')
      // embedded collection
      if (typeof collection?.first !== 'string') {
        return collection?.first?.orderedItems ?? []
      } else if (/^https?:\/\//.test(collection?.first)) {
        collection = await _signAndSend('', collection.first, 'get')
        if (Array.isArray(collection?.orderedItems)) {
          return collection?.orderedItems ?? []
        }
      }
    } catch (e) {
      log.warn('[FEDI] getOutbox %s failed: %s', actor.ap_id, e )
      return []
    }
  }

  export async function unfollowActor (actor) {
    log.debug(`[FEDI] Unfollowing actor ${actor.ap_id}`)

    const object = {
      id: `${publicSettings.baseurl}/federation/m/${actor.ap_id}#follow`,
      type: 'Follow',
      object: actor.ap_id
    }
    
    const body = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: `${publicSettings.baseurl}/federation/m/${actor.ap_id}#unfollow`,
      type: 'Undo',
      actor: `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}`,
      object
    }
    await signAndSend(JSON.stringify(body), actor.object.endpoints?.sharedInbox || actor.object.inbox)
    return actor.update({ following: false })
  }


  // get Actor from URL using GET HTTP Signature 
  export async function getActor (URL, instance, force = false, fail_on_not_cached = false) {
    log.debug(`[FEDI] getActor for ${URL}`)

    let fedi_user

    // try with cache first
    if (!force) {
      fedi_user = await APUser.findByPk(URL, { include: Instance })
      if (fedi_user) {
        return fedi_user
      } else if (fail_on_not_cached) {
        return false
      }
    }

    fedi_user = await _signAndSend('', URL, 'get')
    if (!fedi_user?.id) {
      log.debug('[FEDI] getActor failed for %s', URL)
      return false
    }
    if (fedi_user) {
      log.info('[FEDI] Create/Update a new AP User "%s" and associate it to instance "%s"', fedi_user?.id, instance.domain)
      try {
        ([ fedi_user ] = await APUser.upsert({ ap_id: fedi_user?.id, object: fedi_user, instanceDomain: instance.domain, blocked: false }))
      } catch (e) {
        log.debug('[FEDI] Error in update/create ')
      }
    }
    return fedi_user
  }

export async function getNodeInfo (instance_url) {
  let nodeInfo = await $fetch(`${instance_url}/.well-known/nodeinfo`, { headers: { Accept: 'application/json' } })
    .catch(e => {
      log.debug('[FEDI] Node %s does not support nodeInfo', instance_url)
    })
  
  
  if (nodeInfo?.links) {
    log.info('.well-known/nodeinfo with links!')
    const supportedVersion = nodeInfo.links.find(l => l.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.1' || 'http://nodeinfo.diaspora.software/ns/schema/2.0')
    if (!supportedVersion) {
      log.info('No nodeinfo version supported!')
      return false
    }
    const applicationActor = nodeInfo.links.find(l => l.rel === 'https://www.w3.org/ns/activitystreams#Application')
    log.debug('application actor url: ', applicationActor)
    nodeInfo = await $fetch(supportedVersion.href)
    log.debug('[FEDI] getNodeInfo "%s", applicationActor: %s, nodeInfo: %s', instance_url, applicationActor?.href, nodeInfo)

    if (nodeInfo) {
      return { applicationActor: applicationActor?.href, nodeInfo }
    }
  }
  throw new Error(nodeInfo)
}

  export async function getInstance (actor_url, force = false, fail_on_not_cached = false) {
    log.debug(`[FEDI] getInstance for ${actor_url}`)
    actor_url = new URL(actor_url)
    const domain = actor_url.host
    const instance_url = `${actor_url.protocol}//${actor_url.host}`
    let instance
    if (!force) {
      instance = await Instance.findByPk(domain)
      if (instance) {
        log.debug('[FEDI] Use cached instance: %s', instance.name)
        return instance
      } else if (fail_on_not_cached) {
        return false
      }
    }

    try {
      const { applicationActor, nodeInfo } = await getNodeInfo(instance_url).catch(e => {
        log.warn('get node info failed', e)
      })
      const [ instance ] = await Instance.upsert({
          name: nodeInfo?.metadata?.nodeName ?? domain,
          domain,
          data: nodeInfo ?? {},
          blocked: false,
          applicationActor
        })
      log.debug('[FEDI] Create a new instance from %s: %s %s', instance_url, instance.name, nodeInfo)
      return instance
    } catch(e) {
      log.error('[FEDI] Wrong nodeInfo returned for "%s": %s', instance_url, e?.response?.data ?? String(e))
      return false
    }
  }

  /**
   * HTTP Signature middleware
   * https://www.w3.org/wiki/SocialCG/ActivityPub/Authentication_Authorization#Signing_requests_using_HTTP_Signatures
   * Each POST to /inbox coming from fediverse has to be verified.
   * Signature checking needs Actor's public key
   * @return {Boolean} true in case of successfull validation
   * @throws {H3Error} throw in case of validation failure
   */
  export async function verifySignature (event) {

    const name = event.context.params.name
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
      throw createError({ status: 404, message: `No record found for ${name}` })
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
        return res.sendStatus(201)
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
        return true
        // return res.sendStatus(201)
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

    event.context.fedi_user = ap_actor

    // check Digest
    // cannot do this with json bodyparser (4.a: Enhance HTTP Signature verification for generic AP messages)
    const rawBody = await readRawBody(event)
    const digest = crypto.createHash('sha256')
      .update(rawBody)
      .digest('base64')
    const signature = getHeader(event, 'Digest')
    if (`SHA-256=${digest}` !== signature) {
      log.warn(`Signature mismatch ${signature} - ${digest}`)
      throw createError({ status: 401, message: 'Signature mismatch' })
    }

    const parsed = httpSignature.parseRequest(event.req)
    if (httpSignature.verifySignature(parsed, ap_actor.object.publicKey.publicKeyPem)) {
      log.debug(`[FEDI] Valid signature from ${actor_url} `)
      return true
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
      return true
    }

    // still not valid
    log.info(`[FEDI] Invalid signature from Actor ${actor_url} - ${parsed}`)
    throw createError({ status: 401, message: 'Request signature could not be verified' })
  }
