import { defineEventHandler, getRouterParam, getValidatedQuery, createError, setHeader } from 'h3'
import { getUser } from '~~/server/lib/getUser'

import { Event, Place, Tag, User, mapEvent } from '~~/server/services'
import type { WhereOptions } from '@sequelize/core'
import { Op } from '@sequelize/core'
import { formatSchema } from '~~/server/types/validator'
import { useLogger } from '~~/server/lib/logger'
import { exportICS } from '~~/server/services/ics'
import { canModifyEvent, eventToAP } from '~~/server/services/events'
import { enableCors } from '~~/server/lib/API'

/**
 * Get event details.
 * @param {string | number} slug_or_id - The slug or id of the event
 * @param {string} format - The format of the response (json, json-ld, or ics) (default 'json')
 * @returns Event details in the requested format (JSON, JSON-LD, or ICS)
 * @throws {404} When event is not found or not visible to the current user
 */
export default defineEventHandler(async (evt) => {
  enableCors(evt)
  const log = useLogger('event details!')
  const user = await getUser(evt)

  const slug_or_id = getRouterParam(evt, 'slug_or_id')
  const { format } = await getValidatedQuery(evt, formatSchema.parse)

  const id = Number(slug_or_id)
  const where: WhereOptions<Event> = isNaN(id) || !Number.isInteger(id)
    ? { slug: slug_or_id }
    : { [Op.or]: [{ slug: slug_or_id }, { id }] }

  const event = await Event.findOne({
    where,
    attributes: {
      exclude: ['createdAt', 'placeId', 'apUserApId']
    },
    include: [
      { model: Tag, required: false, attributes: ['tag'], through: { attributes: [] } },
      { model: Place, attributes: ['name', 'address', 'latitude', 'longitude', 'id', 'ap_id'] },
      { model: User, required: false, attributes: ['is_active'] },
      { model: Event, required: false, as: 'parent', attributes: ['id', 'recurrent', 'is_visible', 'start_datetime'] }
    ]
  })

  if (!event) {
    log.warn(`Event not found: ${slug_or_id}`)
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  // TODO
  // admin, editors and event's owner gets the number of moderation messages (could open moderation)
  // let n_messages = 0
  // if (isAdminOrEditor || event.userId !== user?.id) {
  //   n_messages = await Message.count({ where: { eventId: event.id, ...(!isAdminOrEditor && { is_author_visible: true }) } }).catch(() => 0)
  // }

  if (!event.is_visible && !canModifyEvent(event, user)) {
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  if (format === 'json') {
    return mapEvent(event, { user })
  } else if (format === 'json-ld') {
    setHeader(evt, 'Content-Type', 'application/activity+json')
    return eventToAP(event)
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
