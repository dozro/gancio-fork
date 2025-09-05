import { Event, Place, Tag, User, Resource, APUser } from "~~/server/utils/sequelize"
import { Op } from '@sequelize/core'
import { htmlToText } from 'html-to-text'

/**
 * Get event details.
 * @param {string | number} slug_or_id - The slug or id of the event
 * @param {string} format - The format of the response (json, json-ld, or ics) (default 'json')
 * @returns Event details in the requested format (JSON, JSON-LD, or ICS)
 * @throws {404} When event is not found or not visible to the current user
 * @example
 * https://roma.convoca.la/api/event/detail/from-every-river-to-every-sea-palestine-will-be-free
 * https://roma.convoca.la/api/event/detail/from-every-river-to-every-sea-palestine-will-be-free?format=json-ld
 * https://roma.convoca.la/api/event/detail/from-every-river-to-every-sea-palestine-will-be-free?format=ics
 */
export default defineEventHandler(async evt => {
  const log = useLogger('event details!')
  const user = await getUser(evt)
  const isAdminOrEditor = user?.is_editor || user?.is_admin

  const slug_or_id = getRouterParam(evt, 'slug_or_id')
  const { format = 'json' } = getQuery(evt)
  
  const where: any = { [Op.or]: [{ slug: slug_or_id }] }
  const id = Number(slug_or_id)
  if (!isNaN(id) && Number.isInteger(id)) {
    where[Op.or].push({ id })
  }
  
  const event = await Event.findOne({
    where,
      attributes: {
          exclude: ['createdAt', 'updatedAt', 'placeId', 'apUserApId']
        },
        include: [
          { model: Tag, required: false, attributes: ['tag'], through: { attributes: [] } },
          { model: Place, attributes: ['name', 'address', 'latitude', 'longitude', 'id', 'ap_id'] },
          { model: User, required: false, attributes: ['is_active'] },
          {
            model: Resource,
            ...(!isAdminOrEditor && { where: { hidden: false } }),
            include: [{ model: APUser, required: false, attributes: ['object', 'ap_id'] }],
            required: false,
            attributes: ['id', 'activitypub_id', 'data', 'hidden']
          },
          { model: Event, required: false, as: 'parent', attributes: ['id', 'recurrent', 'is_visible', 'start_datetime'] },
        ],
        order: [[Resource, 'id', 'ASC']],
  })

  if (!event) {
    throw createError({ status: 404, message: 'Not found' })
  } 
  
  // admin, editors and event's owner gets the number of messages (could open moderation)
  let n_messages = 0
  if (isAdminOrEditor || event.userId !== user?.id) {
    n_messages = await Message.count({ where: { eventId: event.id, ...(!isAdminOrEditor && { is_author_visible: true }) }}).catch(() => 0)
  }
  
  if (!event || !event.is_visible && !isAdminOrEditor) {
    throw createError({ status: 404 })
  }

  if (format === 'json') {
    const retEvent = event.get()
    retEvent.isMine = event.userId === user?.id
    retEvent.isAnon = event.userId === null || !event?.user?.is_active
    retEvent.n_messages = n_messages
    retEvent.original_url = event?.ap_object?.url || event?.ap_object?.id
    delete retEvent.ap_object
    delete retEvent.user
    delete retEvent.userId
    retEvent.tags = retEvent?.tags?.map(t => t.tag)
    retEvent.end_datetime = Number(retEvent.end_datetime) || null
    retEvent.plain_description = htmlToText(retEvent.description)
    return retEvent
  } else if (format === 'jsonld' || format === 'json-ld') {
    return event.toAP()
  } else if (format === 'ics') {
    // last arg is alarms/reminder, ref: https://github.com/adamgibbons/ics#attributes (alarms)
    exportICS(evt, [event], [{
      action: 'display',
      description: event.title,
      trigger: { hours: 1, before: true }
    }])
  }
})