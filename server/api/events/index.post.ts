import { Event } from "#imports"
import { mkdirp } from 'mkdirp'
import config from '~~/server/config'
import { parseMultipartFormData, saveUploadedEventImage } from "~~/server/utils/parseMultipartForm"
import type { MultiPartData } from "h3"
import { DateTime } from "luxon"
import { findOrCreatePlace } from "~~/server/lib/places"
import { getImageFromURL, sanitizeHTML } from "~~/server/helpers"
import linkifyHtml from "linkify-html"
import { findOrCreateTags } from "~~/server/lib/tags"

try {
  mkdirp.sync(config.upload_path + '/thumb')
} catch (e) {}

/**
 * Add a new event
 * Allow anyone to add an event (anon event has to be confirmed)
 * @todo flood protection
 * @info `Content-Type` has to be `multipart/form-data` to support image upload
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
export default defineEventHandler(async evt => {
  const log = useLogger('New event')
  const user = await getUser(evt)
  log.info(user, publicSettings.allow_anon_event)
  const isAnonymous = !user
  if (isAnonymous && !publicSettings.allow_anon_event) {
    log.warn('Anonymous event creation not allowed')
    throw createError({ status: 403, message: 'Anonymous event creation not allowed', statusMessage: 'Anonymous event creation not allowed' })
  }

  
  const multiPartBody = await parseMultipartFormData(evt)
  const jsonBody = await readBody(evt)
  const body = multiPartBody || jsonBody
  if (!body) {
    console.error(body)
    log.info('Validation error')
    throw createError({ status: 400, message: 'Validation Error' })
  }

  // check for required fields
  const requiredFields = ['title', 'start_datetime']
  const missingField = requiredFields.find(requiredField => !body[requiredField])
  if (missingField) {
    log.warn(`${missingField} required`)
    throw createError({ status: 400, message: `${missingField} required`, statusMessage: `${missingField} required` })
  }
  
  const now = DateTime.local().toUnixInteger()
  const start_datetime = Number(body.start_datetime)

  // validate start_datetime and end_datetime
  if (body.end_datetime) {
    if (body.start_datetime > body.end_datetime) {
      log.debug('start_datetime is greated than end_datetime')
      throw createError({ status: 400, message: `start datetime is greater than end datetime`} )
    }

    if (Number(body.end_datetime) > 1000*24*60*60*365) {
      log.debug('end_datetime is too much in the future')
      throw createError({ status: 400, message: 'are you sure?'} )
    }
  }

  if (!start_datetime) {
    log.debug('start_datetime has to be a number')
    throw createError({ status: 400, message: `Wrong format for start datetime`} )
  }

  if (body.end_datetime && !Number(body.end_datetime)) {
    log.debug('end_datetime has to be a number')
    throw createError({ status: 400, message: `Wrong format for end datetime`} )
  }

  if (start_datetime > 1000*24*60*60*365) {
    log.debug('start_datetime is too much in the future')
    throw createError({ status: 400, message: 'are you sure?'} )
  }

  if(isAnonymous && start_datetime < now) {
    log.debug('anonymous users cannot create past events')
    throw createError({ status: 400, message: 'Anonymous user cannot create past events'} )
  }

  // find or create the place
  const place = await findOrCreatePlace(body)
  if (!place) {
    throw createError({ status: 400, message: 'Place not found' })
  }
  
  const recurrent = body.recurrent ? JSON.parse(body.recurrent as string) : null

  const eventDetails: Event = {
    title: body.title?.trim(),
    // sanitize and linkify html
    description: sanitizeHTML(linkifyHtml(body.description as string || '', { target: '_blank', render: { email: ctx => ctx.content }})),
    // multidate: body.multidate,
    start_datetime,
    end_datetime: body.end_datetime && Number(body.end_datetime),
    online_locations: body.online_locations,
    recurrent,
    // publish this event only if authenticated
    is_visible: !isAnonymous,
    ...(user && { userId: user?.id })
  }

  // do we have an image?
  if (body.image) {
    let focalpoint = body.image_focalpoint ? body.image_focalpoint?.split(',') : ['0', '0']
    focalpoint = [parseFloat(parseFloat(focalpoint[0]).toFixed(2)), parseFloat(parseFloat(focalpoint[1]).toFixed(2))]
    const media = await saveUploadedEventImage(body.image as MultiPartData, body?.image_name || body?.title || '', focalpoint)
    if (media) {
      eventDetails.media = [ media ]
    }
  }
  const event = await Event.create(eventDetails)
  await event.setPlace(place)

  // create/assign tags
  let tags : Tag[] = []
  if (body.tags) {
    if (!Array.isArray(body.tags)) {
      throw createError({ status: 400, message: 'tags field must be an array'})
    }
    tags = await findOrCreateTags(body.tags)
    await event.setTags(tags)
  }

  // event = event.get()
  // event.tags = tags.map(t => t.tag)
  // event.place = place
  // return created event to the client
  // res.json(event)

  // create recurrent instances of event if needed
  // without waiting for the task manager
  if (event?.recurrent && event.is_visible) {
    // eventController._createRecurrent()
  } else {
    // send notifications
    notifyEvent('Create', event.id)
  }
  
  return event
})