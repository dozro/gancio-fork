import config from '../config'
import { signAndSend } from './helpers'
import crypto from 'crypto'

const log = useLogger('AP follow')

// follow request from fediverse
// https://www.w3.org/wiki/ActivityPub/Primer/Follow_activity
export async function follow (event, ap_message) {
  log.warn(ap_message)
  if (typeof ap_message?.object !== 'string') {
    log.warn(`[FEDI] Follow Activity with non string object not supported`)
    throw createError(400, 'Not supported, please set a string as object')
  }
  const username = ap_message.object.replace(`${publicSettings.baseurl}/federation/u/`, '')
  if (username !== publicSettings.instance_name) {
    log.warn(`[FEDI] Following the wrong user: ${username} instead of ${publicSettings.instance_name} (could be a wrong config.baseurl)`)
    throw createError(404, 'User not found')
  }

  await event.context.fedi_user.update({ follower: true })
  log.info(`[FEDI] Followed by ${ap_message.actor}`)
  const guid = crypto.randomUUID()
  const message = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    id: `${publicSettings.baseurl}/federation/${guid}`,
    type: 'Accept',
    actor: `${publicSettings.baseurl}/federation/u/${username}`,
    object: ap_message
  }
  await signAndSend(JSON.stringify(message), event.context.fedi_user.object.inbox)
  // res.status(200).send()
}

// unfollow request from fediverse
export async function unfollow (event, message) {
  console.error(message)
  const username = message.object?.object?.replace(`${publicSettings.baseurl}/federation/u/`, '')
  if (username !== publicSettings.instance_name) {
    log.warn(`[FEDI] Unfollowing wrong user: ${username} instead of ${publicSettings.instance_name}`)
    throw createError(404, 'User not found')
  }

  await event.context.fedi_user.update({ follower: false })
  log.info(`[FEDI] Unfollowed by ${message.actor}`)
  return
}
