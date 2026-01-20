import { Event, Place, Tag, User, Resource, APUser } from '~~/server/utils/sequelize'
import { Op } from '@sequelize/core'
import { formatSchema } from '~~/server/types/validator'

/**
 * Get event details.
 * @param {string | number} slug_or_id - The slug or id of the event
 * @param {string} format - The format of the response (json, json-ld, or ics) (default 'json')
 * @returns Event details in the requested format (JSON, JSON-LD, or ICS)
 * @throws {404} When event is not found or not visible to the current user
 * @example
 * https://demo.gancio.org/api/event/detail/manifestazione
 */
export default defineEventHandler(async (evt) => {
  const log = useLogger('event details!')
  const user = await getUser(evt)
  const isAdminOrEditor = user?.is_editor || user?.is_admin

  const slug_or_id = getRouterParam(evt, 'slug_or_id')
  const { format } = await getValidatedQuery(evt, formatSchema.parse)

  const where: any = { [Op.or]: [{ slug: slug_or_id }] }
  const id = Number(slug_or_id)
  if (!isNaN(id) && Number.isInteger(id)) {
    where[Op.or].push({ id })
  }

  const event = await Event.findOne({
    where,
    attributes: {
      exclude: ['createdAt', 'placeId', 'apUserApId']
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
    log.warn(`Event not found: ${slug_or_id}`)
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  // admin, editors and event's owner gets the number of moderation messages (could open moderation)
  let n_messages = 0
  if (isAdminOrEditor || event.userId !== user?.id) {
    n_messages = await Message.count({ where: { eventId: event.id, ...(!isAdminOrEditor && { is_author_visible: true }) } }).catch(() => 0)
  }

  if (!event?.is_visible && !isAdminOrEditor) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  // manage cache (https://github.com/h3js/h3/issues/1261)
  event.updatedAt.setMilliseconds(0)
  if (handleCacheHeaders(evt, { maxAge: 5, modifiedTime: event.updatedAt })) {
    return
  }

  if (format === 'json') {
    return mapEvent(event)
  } else if (format === 'json-ld') {
    setHeader(evt, 'Content-Type', 'application/activity+json')
    return event.toAP()
  } else if (format === 'ics') {
    setHeader(evt, 'Content-Type', 'text/calendar')
    // last arg is alarms/reminder, ref: https://github.com/adamgibbons/ics#attributes (alarms)
    return exportICS(evt, [event], [{
      action: 'display',
      description: event.title,
      trigger: { hours: 1, before: true }
    }])
  }
})
