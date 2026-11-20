import { useLogger } from '../lib/logger'
import { secretSettings } from '../services/settings'
import { TaskError, useTaskManager } from '../services/taskManager'
import { safeFetch } from '../lib/safeFetch'
import { prepareHTTPSignature } from './httpsignature'
import type { APActivityBase } from './types'

/** the Retry-After header in seconds, it can be a number of seconds or a date */
function parseRetryAfter(value?: string) {
  if (!value) return
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return seconds
  const date = Date.parse(value)
  return Number.isNaN(date) ? undefined : (date - Date.now()) / 1000
}

export async function signAndSend(object: Partial<APActivityBase>, inbox: string, method = 'post') {
  useTaskManager().add({
    name: 'SIGN_AND_SEND',
    method: _signAndSend,
    args: [object, inbox, method, secretSettings.privateKey],
    retries: [1, 5, 10, 30]
  })
}

export async function _signAndSend(object: Partial<APActivityBase> | '', inbox: string, method: 'post' | 'get' = 'post', privkey: string): Promise<unknown | undefined> {
  const log = useLogger('sign_and_send')
  log.debug('[FEDI] Sign and %s %s', method, inbox)

  const body = JSON.stringify(object)
  const httpSignatureHeaders = prepareHTTPSignature(body, inbox, method, privkey)
  try {
    // the inbox or actor URL comes from remote actors
    const ret = await safeFetch(inbox, {
      headers: {
        ...httpSignatureHeaders,
        'Content-Type': 'application/activity+json',
        'Accept': 'application/activity+json'
      },
      method: method === 'post' ? 'POST' : 'GET',
      ...(method === 'post' ? { body } : {}),
      // federated instances could use any port
      anyPort: true
    })

    const contentType = ret.headers['content-type']
    const text = ret.body.toString('utf8')

    // check the status first: error responses are often not json (e.g. from a proxy) and have to be retried too
    if (ret.status < 200 || ret.status >= 300) {
      log.error('Error in sign and send status [%s]: %s %s', inbox, ret.status, text.slice(0, 200))
      // retry only temporary errors, as mastodon does
      throw new TaskError(`Status ${ret.status}`, {
        retry: ret.status >= 500 || [401, 408, 429].includes(ret.status),
        retryAfter: parseRetryAfter(ret.headers['retry-after'])
      })
    }

    // check if content-type is json
    if (!contentType?.includes('json')) {
      log.info(`[FEDI] Wrong content-type returned in sign and send: ${contentType} - status: ${ret.status}`)
      return
    }

    log.debug(`Signed and verified! ${ret.status} => ${contentType}`)
    if (!text) return ''
    try {
      return JSON.parse(text)
    } catch {
      log.warn('Invalid JSON response', text)
      return ''
    }
  } catch (e) {
    log.error('Error in sign and send [%s]: %s', inbox, e?.response?.data?.error ?? e?.response?.statusMessage ?? '' + ' ' + String(e))
    throw e
  }
}
