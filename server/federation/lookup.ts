import { ofetch } from 'ofetch'
import { _signAndSend } from './sign_and_send'
import { useLogger } from '../lib/logger'
import { Instance, type APUser } from '../services/db'
import { getActor } from './get_actor'
// import { secretSettings } from '../services'

const log = useLogger('federation')

/**
 * https://swicg.github.io/activitypub-http-signature/#how-to-obtain-a-signature-s-public-key
 */
export async function getActorFromKeyId(keyId: string): Promise<APUser | undefined> {
  log.debug(`[FEDI] getActorFromKeyId for ${keyId}`)
  // 1. it should be an URL
  const url = new URL(keyId)

  // 2. search it locally
  // 3. if not found, fetch it from the network (discarding its fragment first if necessary)
  url.hash = ''
  const actor = await getActor(url.href) // await _signAndSend('', url.href, 'get', secretSettings.privateKey)
  return actor
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
