import type { CreationAttributes } from '@sequelize/core'
import { parseMultipartFormData, saveUploadedEventImage } from '~~/server/lib/parseMultipartForm'
import { useLogger } from '~~/server/lib/logger'
import type { MultiPartData } from 'h3'
import { DateTime } from 'luxon'
import { findOrCreatePlace } from '~~/server/services/places'
import { sanitizeHTML } from '~~/server/helpers'
import linkifyHtml from 'linkify-html'
import { findOrCreateTags } from '~~/server/services/tags'
import type { Tag } from '~~/server/services'
import { Event, mapEvent } from '~~/server/services'
import { notifyEvent } from '~~/server/services/notifier'

/**
 * Update an event
 * @todo flood protection
 * @info `Content-Type` has to be `multipart/form-data` to support image upload
 * @param {number} id - event id
 * @param {string} title - event's title
 * @param {string} description - event's description (html accepted and sanitized)
 * @param {string} place_name - the name of the place
 * @param {string} [place_address] - the address of the place
 * @param {float} [place_latitude] - the latitude of the place
 * @param {float} [place_longitude] - the longitude of the place
 * @param {array} online_locations - List of online locations
 * @param {number} start_datetime - start timestamp
 * @param {integer} multidate - is a multidate event?
 * @param {array} tags - List of tags
 * @param {object} [recurrent] - Recurrent event details
 * @param {string} [recurrent.frequency] - could be `1w` or `2w`
 * @param {array} [recurrent.days] - array of days
 * @param {image} [image] - Image
 * @param {string} [image_url] - Image URL
 * @todo Multiple images upload
 */
export default defineEventHandler(async (evt) => {
  const log = useLogger('Update event')
  const id = getRouterParam(evt, 'id')
  const user = await getUser(evt)
  const isAnonymous = !user
  if (isAnonymous) {
    log.warn('Anonymous user cannot update events')
    throw createError({ statusCode: 403, statusMessage: 'Anonymous user cannot update events' })
  }

  const multiPartBody = await parseMultipartFormData(evt)
  const jsonBody = await readBody(evt)
  const body = multiPartBody || jsonBody
  if (!body) {
    log.info('Validation error')
    throw createError({ statusCode: 400, statusMessage: 'Validation Error' })
  }

  if (!id || !Number(id)) {
    log.warn('Event not found: %s', id)
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  const event = await Event.findByPk(id)
  if (!event) {
    log.warn('Event not found: %s', id)
    throw createError({ statusCode: 404, statusMessage: 'Event not found' })
  }

  // check for required fields
  const requiredFields = ['title', 'start_datetime']
  const missingField = requiredFields.find(requiredField => !body[requiredField])
  if (missingField) {
    log.warn(`${missingField} required`)
    throw createError({ statusCode: 400, statusMessage: `${missingField} required` })
  }

  const now = DateTime.local().toUnixInteger()
  const start_datetime = Number(body.start_datetime)

  // validate start_datetime and end_datetime
  if (body.end_datetime) {
    if (body.start_datetime > body.end_datetime) {
      log.debug('start_datetime is greated than end_datetime')
      throw createError({ statusCode: 400, statusMessage: `start datetime is greater than end datetime` })
    }

    if (Number(body.end_datetime) > 1000 * 24 * 60 * 60 * 365) {
      log.debug('end_datetime is too much in the future')
      throw createError({ statusCode: 400, statusMessage: 'are you sure?' })
    }
  }

  if (!start_datetime) {
    log.debug('start_datetime has to be a number')
    throw createError({ statusCode: 400, statusMessage: `Wrong format for start datetime` })
  }

  if (body.end_datetime && !Number(body.end_datetime)) {
    log.debug('end_datetime has to be a number')
    throw createError({ statusCode: 400, statusMessage: `Wrong format for end datetime` })
  }

  if (start_datetime > 1000 * 24 * 60 * 60 * 365) {
    log.debug('start_datetime is too much in the future')
    throw createError({ statusCode: 400, statusMessage: 'are you sure?' })
  }

  if (isAnonymous && start_datetime < now) {
    log.debug('anonymous users cannot create past events')
    throw createError({ statusCode: 400, statusMessage: 'Anonymous user cannot create past events' })
  }

  // find or create the place
  const placeData = {
    id: body.place_id,
    name: body.place_name,
    latitude: body.latutude,
    address: body.place_address,
    longitude: body.longitude
  }
  const place = await findOrCreatePlace(placeData)
  if (!place) {
    throw createError({ statusCode: 400, statusMessage: 'Place not found' })
  }

  const recurrent = body.recurrent ? JSON.parse(body.recurrent as string) : null

  const eventDetails: CreationAttributes<Event> = {
    title: body.title?.trim(),
    // sanitize and linkify html
    description: sanitizeHTML(linkifyHtml(body.description as string || '', { target: '_blank', render: { email: ctx => ctx.content } })),
    start_datetime,
    end_datetime: body.end_datetime && Number(body.end_datetime),
    online_locations: body.online_locations,
    recurrent,
    // publish this event only if authenticated
    is_visible: !isAnonymous,
    ...(user && { userId: user?.id })
  }

  // do we have an image?
  if (body.image?.data) {
    let focalpoint = body.image_focalpoint ? body.image_focalpoint?.split(',') : ['0', '0']
    focalpoint = [parseFloat(parseFloat(focalpoint[0]).toFixed(2)), parseFloat(parseFloat(focalpoint[1]).toFixed(2))]
    const media = await saveUploadedEventImage(body.image as MultiPartData, body?.image_name || body?.title || '', focalpoint)
    if (media) {
      eventDetails.media = [media]
    }
  }
  await event.update(eventDetails)
  await event.setPlace(place)

  // create/assign tags
  let tags: Tag[] = []
  if (body.tags) {
    if (!Array.isArray(body.tags)) {
      throw createError({ statusCode: 400, message: 'tags field must be an array' })
    }
    tags = await findOrCreateTags(body.tags)
    await event.setTags(tags)
  }

  // create recurrent instances of event if needed
  // without waiting for the task manager
  if (event?.recurrent && event.is_visible) {
    // eventController._createRecurrent()
  } else {
    // send notifications
    notifyEvent('Update', event.id)
  }

  return mapEvent(event, place, tags, user)
})
