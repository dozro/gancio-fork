import { defineEventHandler, getRouterParam, createError, readBody } from 'h3'
import type { CreationAttributes } from '@sequelize/core'
import { parseMultipartFormData } from '~~/server/lib/parseMultipartForm'
import { useLogger } from '~~/server/lib/logger'
import { findOrCreatePlace } from '~~/server/services/places'
import { findOrCreateTags } from '~~/server/services/tags'
import type { Place, Tag } from '~~/server/services/db'
import { Event, mapEvent, publicSettings, secretSettings } from '~~/server/services'
import { notifyEvent } from '~~/server/services/notifier'
import { eventToAP, setEventMedia, validateEvent } from '~~/server/services/events'
import { z } from 'zod'
import { sign } from '~~/server/federation/ldsignature'
import { getUser } from '~~/server/lib/getUser'

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
  const id = Number(getRouterParam(evt, 'id'))
  const user = await getUser(evt)
  const multiPartBody = await parseMultipartFormData(evt)
  const jsonBody = await readBody(evt)

  if (isNaN(id)) {
    log.warn('Event not found: %s', id)
    throw createError({ statusCode: 404, message: 'Event not found' })
  }
  let eventPayload: CreationAttributes<Event>
    & { place?: { id?: number, name?: string, address: string } }
    & { tags?: string[] }
  try {
    eventPayload = validateEvent(publicSettings, user).parse(multiPartBody || jsonBody)
  } catch (e) {
    log.warn(e)
    const message = e instanceof z.ZodError ? e.issues[0]?.message : String(e)
    throw createError({ statusCode: 400, message })
  }

  const event = await Event.findByPk(id)
  if (!event) {
    log.warn('Event not found: %s', id)
    throw createError({ statusCode: 404, message: 'Event not found' })
  }

  // find or create the place
  let place: Place | null = null
  if (eventPayload.place) {
    place = await findOrCreatePlace(eventPayload.place)
      .catch((e) => {
        log.warn(e)
        throw createError({ statusCode: 400, message: String(e) })
      })
    eventPayload.placeId = place?.id
  }

  // const recurrent = body.recurrent ? JSON.parse(body.recurrent as string) : null
  // do we have an image?
  const media = await setEventMedia(eventPayload)
  if (media) {
    eventPayload.media = [media]
  }
  await event.update(eventPayload)

  // create/assign tags
  let tags: Tag[] = []
  if (eventPayload.tags) {
    tags = await findOrCreateTags(eventPayload.tags)
    await event.setTags(tags)
  }

  // create recurrent instances of event if needed
  // without waiting for the task manager
  if (event?.recurrent && event.is_visible) {
    // eventController._createRecurrent()
  } else {
    // sign Event if federation is enabled
    if (publicSettings.enable_federation) {
      try {
        event.ld_signature = await sign(eventToAP(event), secretSettings.privateKey, `${publicSettings.baseurl}/federation/u/${publicSettings.instance_name}#main-key`)
        await event.save({ silent: true })
      } catch (e) {
        log.warn('Error signing Event ', e)
      }
    }
    // send notifications
    notifyEvent('Update', event.id)
  }

  return mapEvent(event, place, tags, user)
})
