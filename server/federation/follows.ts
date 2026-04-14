import { publicSettings } from '../services'
import { useLogger } from '../lib/logger'
import { signAndSend } from './sign_and_send'
import crypto from 'crypto'
import type { APActivityFollow, APActivityUndo } from './types'

const log = useLogger('AP follow')

// follow request from fediverse
// https://www.w3.org/wiki/ActivityPub/Primer/Follow_activity
export async function handleFollow(ap_message: APActivityFollow, actor: APUser) {
  if (typeof ap_message?.object !== 'string') {
    log.warn(`[FEDI] Follow Activity with non string object not supported`)
    throw createError({ status: 400, message: 'Not supported, please set a string as object' })
  }
  const username = ap_message.object.replace(`${publicSettings.baseurl}/federation/u/`, '')
  if (username !== publicSettings.instance_name) {
    log.warn(`[FEDI] Following the wrong user: ${username} instead of ${publicSettings.instance_name} (could be a wrong config.baseurl)`)
    throw createError({ status: 400, message: 'User not found' })
  }

  log.info(`[FEDI] Followed by ${ap_message.actor}`)
  const guid = crypto.randomUUID()
  const message = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    'id': `${publicSettings.baseurl}/federation/${guid}`,
    'type': 'Accept',
    'actor': `${publicSettings.baseurl}/federation/u/${username}`,
    'object': ap_message
  }
  await signAndSend(message, actor.object.inbox)
  await actor.update({ follower: true })
}

// unfollow request from fediverse
export async function handleUnfollow(message: APActivityUndo, actor: APUser) {
  const username = message.object?.object?.replace(`${publicSettings.baseurl}/federation/u/`, '')
  if (username !== publicSettings.instance_name) {
    log.warn(`[FEDI] Unfollowing wrong user: ${username} instead of ${publicSettings.instance_name}`)
    throw createError({ status: 400, message: 'User not found' })
  }

  await actor.update({ follower: false })
  log.info(`[FEDI] Unfollowed by ${message.actor}`)
  return
}
