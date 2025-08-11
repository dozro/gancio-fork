import { z } from "zod"
// import { APUser } from "~/server/utils/sequelize"
import { followActor, unfollowActor, getInstance, getActor } from  '~~/server/federation/helpers.js'
import config from '../../config'
import { isHiddenService } from '../../helpers'

const schema = z.object({
  url: z.string()
})

export default defineEventHandler(async event => {
  
  // authenticate
  // await requireAdminSession(event)

  const log = useLogger('add trust')
  const body = await readValidatedBody(event, schema.parse)

  /**
    * url
    * in case we have a @ we should use webfinger 
    * in case we have a full url could be an actor
    * or a nodeinfo url to search for 
    */
  let url = body.url
  let instance


  // @actor@instance.tld syntax, let's use webfinger
  if (!url.startsWith('http') && url.includes('@')) {
    const [ user, instance_url ] = url.replace(/^@/,'').split('@')
    log.debug('[FEDI] Adds user: %s and instance: %s because url was: %s', user, instance_url, url)
    try {
      let protocol = "https://"
      if (config.hidden_service === "true" && isHiddenService(url)) {
        protocol = "http://"
      }

      if (config.hidden_service !== "true" && isHiddenService(url)) {
        log.warn('[FEDI] Trying to trust instance %s but hidden services are not enabled', instance_url)
        throw createError({ status: 403, message: 'Hidden service not allowed' })
      }

      instance = await getInstance(protocol + instance_url, true)

      if (!instance) { 
        throw createError({ status: 404, message: 'This ap instance does not exists' })
      }
      
      const webfinger = await $fetch(`${protocol}${instance_url}/.well-known/webfinger?resource=acct:${user}@${instance_url}`)
      if (webfinger?.links) {
        const actor_url = webfinger.links.find(l => l.rel === 'self')
        if (!actor_url) {
          log.warn('[FEDI] Cannot found `self` links in webfinger of %s', url)
          throw createError({ status: 404, message: 'No self links in webfinger' })
        }

        log.info(`[FEDI] Adding trusted instance ${instance_url} and actor ${actor_url.href}...`)
        const actor = await getActor(actor_url.href, instance, true)
        log.debug('[FEDI] Actor %s', actor.ap_id)
        await actor.update({ trusted: true })
        return actor
      }
    } catch (e) {
      log.error('[FEDI] Wrong webfinger response from %s: %s ', url, e?.response?.data ?? String(e))
      throw createError({ status: 404, message: 'Wrong webfinger response' })
    }
  }

  try {
    // this could be an actor
    if (!url.startsWith('http')) {
      url = `https://${url}`
    }
    url = url.replace(/\/$/, '')

    log.info(`[FEDI] Adding trusted instance ${url} ...`)
    instance = await getInstance(url, true)
    if (!instance) {
      throw createError({ status: 404, message: 'No instance' })
    }

    let actor
    // should we try to use URL as actor? to review
    try {
      log.debug('[FEDI] Trying to use %s as actor', url)
      actor = await getActor(url, instance)
      if (actor) {
        log.debug('[FEDI] Actor %s', actor.ap_id)
        await actor.update({ trusted: true })
        await followActor(actor)
        return actor
      }
    } catch (e) {
      log.debug('[FEDI] %s is probably not an actor: %s', url, String(e))
    }

    // ok this wasn't an actor, let's use the applicationActor if exists
    if (!actor && instance?.applicationActor) {
      log.debug('[FEDI] This node supports FEP-2677 and applicationActor is: %s', instance.applicationActor)
      actor = await getActor(instance.applicationActor, instance, true)
      console.error('dopo il get actor!')
      console.error(actor)
      log.debug('[FEDI] Actor %s', actor.ap_id)
      await actor.update({ trusted: true })
      return actor
    }

    // supports old gancio / mobilizon instances default actor
    // if (instance?.data?.software?.name === 'Mobilizon') {
    //   instance.actor = 'relay'
    // } else if (instance?.data?.software?.name === 'gancio') {
    //   instance.actor = instance?.data?.metadata?.nodeActor' ?? 'relay'
    // }
    log.debug(`[FEDI] instance .well-known: ${instance.name} - ${instance.domain}`)

    // if we have an actor, let's make a new friend
    if (instance.actor) {

      // send a well-known request
      const instance_hostname = new URL(url).host
      const webfinger = await $fetch(`${url}/.well-known/webfinger?resource=acct:${instance.actor}@${instance_hostname}`)
      if (!webfinger?.links) {
        throw createError({ status: 404, message: 'No links in webfinger' })
      }

      // search for actor url
      const actorURL = webfinger?.links.find(l => l.rel === 'self').href

      // retrieve the AP actor and flag it as trusted
      const actor = await getActor(actorURL, instance, true)
      await actor.update({ trusted: true })
      return actor
    }
    throw createError({ status: 404, message: 'No way' })
  } catch (e) {
    console.error(e) 
    log.error('[FEDI] Error adding trusted actor %s', e?.response?.data ?? String(e))
    throw createError({ status: 404, message: 'Error adding trusted actor' })
  }
})
