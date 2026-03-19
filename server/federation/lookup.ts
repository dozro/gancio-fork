import { ofetch } from 'ofetch'
import { parseAPLocation } from './places'
import { getImageFromURL, sanitizeHTML } from '../helpers'
import { findOrCreateTags } from '../services/tags'
import { _signAndSend } from './sign_and_send'
import { useLogger } from '../lib/logger'
import { useTaskManager } from '../services/taskManager'
import { publicSettings, secretSettings } from '../services'
import { Instance, Event, APUser } from '../services/db'
import { eventToAP } from '../services/events'
import type { H3Event } from 'h3'
import { z } from 'zod'
import { APActivityTypeSchema, type APActor, type APEvent } from './types'
import { handleCreateEvent } from './events'
import { APHandlers } from './handlers'

const log = useLogger('federation')

// get Actor from URL using GET HTTP Signature
export async function getActor(URL: string, instance: Instance, force = false, fail_on_not_cached = false) {
  log.debug(`[FEDI] getActor for ${URL}`)

  let fedi_user: APUser | null

  // try with cache first
  if (!force) {
    fedi_user = await APUser.findByPk(URL, { include: Instance })
    if (fedi_user) {
      return fedi_user
    } else if (fail_on_not_cached) {
      return
    }
  }

  try {
    const ret: APActor = await _signAndSend('', URL, 'get', secretSettings.privateKey)
    if (!ret?.id) {
      log.debug('[FEDI] getActor failed for %s', URL)
      return
    }
    if (ret) {
      log.info('[FEDI] Create/Update a new AP User "%s" and associate it to instance "%s"', ret.id, instance.domain)
      try {
        ([fedi_user] = await APUser.upsert({
          ap_id: ret.id,
          object: { ...ret, summary: sanitizeHTML(ret?.summary ?? '') },
          instanceDomain: instance.domain,
          blocked: false
        }))
        return fedi_user
      } catch (e) {
        log.debug('[FEDI] Error in update/create ', e)
      }
    }
  } catch (e) {
    log.debug('[FEDI] nope ', e)
    return
  }
}

export async function getNodeInfo(instance_url: string) {
  let nodeInfo = await ofetch(`${instance_url}/.well-known/nodeinfo`, { headers: { Accept: 'application/json' } })
    .catch(() => {
      log.debug('[FEDI] Node %s does not support nodeInfo', instance_url)
    })

  if (nodeInfo?.links) {
    log.info('.well-known/nodeinfo with links!')
    const supportedVersion = nodeInfo.links.find(l => l.rel === 'http://nodeinfo.diaspora.software/ns/schema/2.1' || 'http://nodeinfo.diaspora.software/ns/schema/2.0')
    if (!supportedVersion) {
      log.info('No nodeinfo version supported!')
      return
    }
    const applicationActor = nodeInfo.links.find(l => l.rel === 'https://www.w3.org/ns/activitystreams#Application')
    log.debug('application actor url: ', applicationActor)
    nodeInfo = await ofetch(supportedVersion?.href)
    log.debug('[FEDI] getNodeInfo "%s", applicationActor: %s, nodeInfo: %s', instance_url, applicationActor?.href, nodeInfo)

    if (nodeInfo) {
      return { applicationActor: applicationActor?.href, nodeInfo }
    }
  }
}

export async function getInstance(actor_url: string, force = false, fail_on_not_cached = false) {
  log.debug(`[FEDI] getInstance for ${actor_url}`)
  console.error('getInstance', actor_url)
  const url = new URL(actor_url)
  const domain = url.host
  const instance_url = `${url.protocol}//${url.host}`
  let instance
  if (!force) {
    instance = await Instance.findByPk(domain)
    if (instance) {
      log.debug('[FEDI] Use cached instance: %s', instance.name)
      return instance
    } else if (fail_on_not_cached) {
      return
    }
  }

  try {
    const { applicationActor, nodeInfo } = await getNodeInfo(instance_url).catch((e) => {
      log.warn('get node info failed', e)
    })
    const [instance] = await Instance.upsert({
      name: nodeInfo?.metadata?.nodeName ?? domain,
      domain,
      data: nodeInfo ?? {},
      blocked: false,
      applicationActor
    })
    log.debug('[FEDI] Create a new instance from %s: %s %s', instance_url, instance.name, nodeInfo)
    return instance
  } catch (e) {
    log.warn('[FEDI] Wrong nodeInfo returned for "%s": %s', instance_url, e?.response?.data ?? String(e))
  }
}
