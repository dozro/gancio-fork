import { useLogger } from '../lib/logger'
import { secretSettings } from '../services/settings'
import { sanitizeHTML } from '../helpers'
import { _signAndSend } from './sign_and_send'
import { Instance, APUser } from '../services/db'

import { getInstance } from './lookup'
import { importActorKeys } from './keys'
import type { APActor } from './types'

const log = useLogger('federation')

// force an update of the actor if it is older than 1 week
const MAX_TTL = 60 * 60 * 24 * 7 // 1 week

function isSameOrigin(a: string, b: string) {
  try {
    return new URL(a).origin === new URL(b).origin
  } catch {
    return false
  }
}

/**
 * Get an Actor from a URL using GET HTTP Signature.
 * @param actorUrl - The URL of the Actor to get.
 * @param bypassCache - bypass the cache and make a fresh request.
 * @returns The APUser representing the Actor, or undefined if not found.
 */
export async function getActor(actorUrl: string, bypassCache = false): Promise<APUser | undefined> {
  log.debug(`[FEDI] getActor for ${actorUrl}`)
  let fedi_user

  // try with cache first
  if (!bypassCache) {
    fedi_user = await APUser.findByPk(actorUrl, { include: { model: Instance, required: true } }) as APUser & { instance: Instance }
    if (fedi_user && fedi_user.updatedAt && (Date.now() - fedi_user.updatedAt.getTime()) < MAX_TTL) {
      return fedi_user
    }
  }

  try {
    let ret = await _signAndSend('', actorUrl, 'get', secretSettings.privateKey) as APActor | undefined
    if (!ret?.id) {
      log.debug('getActor failed for %s', actorUrl)
      return
    }

    // a document can only speak for its own origin -> https://framagit.org/les/gancio/-/work_items/766
    // when the id is elsewhere (e.g. a moved instance) ask its origin, that has to return the same id (as mastodon does)
    if (!isSameOrigin(ret.id, actorUrl)) {
      const id = ret.id
      ret = await _signAndSend('', id, 'get', secretSettings.privateKey) as APActor | undefined
      if (ret?.id !== id) {
        log.warn('getActor: %s returned an actor of another origin (%s) not confirmed by its origin', actorUrl, id)
        return
      }
    }

    if (!['Application', 'Group', 'Organization', 'Person', 'Service'].includes(ret?.type)) {
      log.debug('getActor failed for %s, invalid type %s', actorUrl, ret?.type)
      return
    }

    if (ret) {
      // the actor belongs to the instance of its id, that could differ from the requested URL
      const instance = await getInstance(ret.id, false)
      log.info('[FEDI] Create/Update a new AP User "%s" and associate it to instance "%s"', ret.id, instance?.domain)
      try {
        ([fedi_user] = await APUser.upsert({
          ap_id: ret.id,
          object: { ...ret, summary: sanitizeHTML(ret?.summary ?? '') },
          instanceDomain: instance.domain ?? new URL(ret.id).origin,
          blocked: false
        }))

        await importActorKeys(ret)
        await fedi_user.setInstance(instance)
        return fedi_user
      } catch (e) {
        log.debug('[FEDI] Error in update/create ', e)
      }
    }
  } catch (e) {
    log.debug('getActor failed for %s, %s', actorUrl, e)
  }
  return
}