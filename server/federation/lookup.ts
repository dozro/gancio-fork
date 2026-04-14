import { ofetch } from 'ofetch'
import { sanitizeHTML } from '../helpers'
import { _signAndSend } from './sign_and_send'
import { useLogger } from '../lib/logger'
import { secretSettings } from '../services'
import { Instance, APUser } from '../services/db'
import type { APActor } from './types'

const log = useLogger('federation')

/**
 * Get an Actor from a URL using GET HTTP Signature.
 * @param actorUrl - The URL of the Actor to get.
 * @param force - bypass the cache and make a fresh request.
 * @returns The APUser representing the Actor, or null if not found.
 */
export async function getActor(actorUrl: string, force = false) {
  log.debug(`[FEDI] getActor for ${actorUrl}`)
  let fedi_user

  // try with cache first
  if (!force) {
    fedi_user = await APUser.findByPk(actorUrl, { include: { model: Instance, required: true } }) as APUser & { instance: Instance }
    if (fedi_user) {
      return fedi_user
    }
  }

  try {
    const ret: APActor = await _signAndSend('', actorUrl, 'get', secretSettings.privateKey)
    if (!ret?.id) {
      log.debug('getActor failed for %s', actorUrl)
      return
    }

    if (ret) {
      const instance = await getInstance(actorUrl, false)
      log.info('[FEDI] Create/Update a new AP User "%s" and associate it to instance "%s"', ret.id, instance?.domain)
      try {
        ([fedi_user] = await APUser.upsert({
          ap_id: ret.id,
          object: { ...ret, summary: sanitizeHTML(ret?.summary ?? '') },
          instanceDomain: instance.domain ?? new URL(actorUrl).origin,
          blocked: false
        }))

        await fedi_user.setInstance(instance)
        return fedi_user
      } catch (e) {
        log.debug('[FEDI] Error in update/create ', e)
      }
    }
  } catch (e) {
    log.debug('getActor failed for %s, %s', actorUrl, e)
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

export async function getInstance(actor_url: string, force = false) {
  log.debug(`[FEDI] getInstance for ${actor_url}`)
  const url = new URL(actor_url)
  const domain = url.host
  const instance_url = `${url.protocol}//${url.host}`
  let instance
  if (!force) {
    instance = await Instance.findByPk(domain)
    if (instance) {
      log.debug('[FEDI] Use cached instance: %s', instance.name)
      return instance
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
    const [instance] = await Instance.upsert({
      name: domain,
      domain,
      data: '',
      blocked: false,
      applicationActor: undefined
    })
    log.info('nodeInfo not supported for "%s": %s', instance_url, e?.response?.data ?? String(e))
    return instance
  }
}
