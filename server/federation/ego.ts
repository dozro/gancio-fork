import { useLogger } from '../lib/logger'
import { type APUser, Event, publicSettings } from '../services'
import type { APActivityLike, APActivityUndo } from './types'
const log = useLogger('federation:ego')

// module.exports = {
//   async boost (APMessage, actor) {
//     const match = APMessage?.match(`${config.baseurl}/federation/m/(.*)`)
//     if (!match || match.length < 2) {
//       log.debug('[FEDI] Boosted something not local: %s', APMessage)
//       throw new NotFoundError('Event not found')
//     }
//     log.info(`[FEDI] boost ${match[1]}`)
//     const event = await Event.findByPk(Number(match[1]))
//     if (!event) {
//       log.debug('[FEDI] Boosted event not found: %s', APMessage)
//       throw new NotFoundError('Event not found')
//     }

//     return event.update({ boost: [...event.boost, actor] })
//   },

//   async unboost (req, res) {
//     const APMessage = req.body?.object
//     const ap_id = APMessage?.object?.object ?? APMessage?.object
//     log.info(`[FEDI] Unboost ${ap_id}`)
//     const match = ap_id?.match(`${config.baseurl}/federation/m/(.*)`)
//     if (!match || match.length < 2) {
//       // unboost remote event
//       const event = await Event.findOne({ where: { ap_id } })
//       if (!event) { return res.status(404).send('Event not found!') }
//       await event.destroy()
//     } else {
//       const event = await Event.findByPk(Number(match[1]))
//       if (!event) { return res.status(404).send('Event not found!') }
//       await event.update({ boost: event.boost.filter(actor => actor !== req.body.actor) })
//     }
//   },


export async function handleLike(message: APActivityLike, actor: APUser) {
  const obj = message.object
  if (!obj) return
  const match = obj.match(`^${publicSettings.baseurl}/federation/m/(.*)`)
  if (!match || match.length < 2) {
    log.debug('No match for like: %s', JSON.stringify(message))
    throw new Error('Event not found!')
  }
  const event = await Event.findByPk(Number(match[1]))
  if (!event) {
    throw new Error('Event not found!')
  }
  
  // check if already liked
  if (event.likes.includes(actor.ap_id)) {
    log.debug(`${actor.ap_id} already liked ${event.title}`)
    return
  }
  
  log.info(`${actor.ap_id} like ${event.title} (${event.likes.length})`)
  await event.update({ likes: [...event.likes, actor.ap_id] })
}

export async function handleUnlike(message: APActivityUndo, actor: APUser) {
  const obj = message.object.object
  if (!obj) return

  const match = obj?.match(`^${publicSettings.baseurl}/federation/m/(.*)`)
  if (!match || match.length < 2) {
    log.debug('No match for like: %s', JSON.stringify(message))
    throw new Error('Event not found!')
  }
  const event = await Event.findByPk(Number(match[1]))
  if (!event) {
    throw new Error('Event not found!')
  }
  log.info(`${actor.ap_id} unlike ${event.title} (${event.likes.length})`)
  await event.update({ likes: event.likes.filter(id => id !== actor.ap_id) })
}