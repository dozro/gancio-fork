import { defineEventHandler, readBody } from 'h3'
import { getUser } from '~~/server/lib/getUser'
import { parseMultipartFormData } from '~~/server/lib/parseMultipartForm'
import { upsertEvent, mapEvent } from '~~/server/services/events'

/**
 * Add a new event
 * Allow anyone to add an event (anon event has to be confirmed)
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
 * @param {boolean} [is_visible] - Event is visible or not
 * @param {string} [image_url] - Image URL
 * @todo Multiple images upload
 */
export default defineEventHandler(async (evt) => {
  const user = await getUser(evt)
  const multiPartBody = await parseMultipartFormData(evt)
  const jsonBody = await readBody(evt)

  const { event, place, tags } = await upsertEvent(multiPartBody || jsonBody, user)
  return mapEvent(event, { user, place, tags })

})
