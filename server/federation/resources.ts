import linkifyHtml from 'linkify-html'
import { sanitizeHTML } from '../helpers'
import { useLogger } from '../lib/logger'
import { Event, publicSettings, Resource } from '../services'
import type { APNote } from './types'
import { _signAndSend } from './sign_and_send'
import { getSetting } from '../services/settings'

const log = useLogger('federation:notes')

/**
 * Gancio could receive a `Note` from a remote actor to comment on an event
 * I know this could sounds a little confusing but this is internally called `Resource` to explicitly
 * indicate that this is not a comment but could be another media (image, video, audio, etc.)
 */
export async function handleCreateNote(message: APNote, actor: APUser) {
  if (!publicSettings.enable_resources) {
    log.info('Ignore resource as it is disabled in settings')
    throw new Error('Note are disabled')
  }

  // search for related event
  let event

  // it's an answer
  const inReplyTo = message?.inReplyTo
  if (inReplyTo) {
    // .. to an event ?
    const match = inReplyTo && inReplyTo.match('.*/federation/m/(.*)')
    log.info(`Event reply => ${inReplyTo}`)
    if (match) {
      event = await Event.findByPk(Number(match[1]))
    } else {
      // in reply to another resource...
      const resource = await Resource.findOne({ where: { activitypub_id: inReplyTo }, include: [Event] })
      event = resource && resource.event

      if (!event) {
        // in reply to a remote event
        event = await Event.findOne({ where: { ap_id: inReplyTo } })
      }
    }
  }

  if (!event) {
    log.error('Create Activity for Note object are only supported for events or other local notes')
    log.error(message)
    throw new Error('Not found')
  }

  log.debug(`Reply from ${actor.ap_id} to "${publicSettings.baseurl}/event/${event.slug}"`)

  message.content = sanitizeHTML(linkifyHtml(message.content || '', { target: '_blank', render: { email: ctx => ctx.content } }))

  await Resource.create({
    activitypub_id: message.id,
    apUserApId: actor.ap_id,
    data: message,
    eventId: event && event.id
  })

}


/**
 * Update a resource from AP Note
 * the actor should be the same as the resource's author
 */
export async function handleUpdateNote(message: APNote, actor: APUser) {
  if (publicSettings.enable_resources) {
    log.info('Ignore note as it is disabled in settings')
    return
  }

  const resource = await Resource.findOne({ where: { activitypub_id: message?.id, apUserApId: actor.ap_id } })
  if (!resource) {
    log.warn('Note not found')
    throw new Error('Not found')
  }

  message.content = sanitizeHTML(linkifyHtml(message.content || '', { target: '_blank', render: { email: ctx => ctx.content } }))

  await resource.update({
    data: message
  })

  log.debug('Note updated!')
}


export async function handleDeleteNote(message: APNote, actor: APUser) {
  const resource = await Resource.findOne({ where: { activitypub_id: message?.id, apUserApId: actor.ap_id } })
  if (!resource) {
    log.warn(`Note not found`)
    throw new Error('Not found')
  }
  await resource.destroy()
  log.info(`Note ${resource.activitypub_id} removed`)
}