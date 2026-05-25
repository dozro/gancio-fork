import { defineEventHandler, getRouterParam, readBody } from 'h3'
import { parseMultipartFormData } from '~~/server/lib/parseMultipartForm'
import { mapEvent } from '~~/server/services'
import { upsertEvent } from '~~/server/services/events'
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
  const id = Number(getRouterParam(evt, 'id'))
  const user = await getUser(evt)
  const multiPartBody = await parseMultipartFormData(evt)
  const jsonBody = await readBody(evt)

  const payload = multiPartBody || jsonBody
  payload.id = id
  const { event, place, tags } = await upsertEvent(payload, user)
  return mapEvent(event, { user, place, tags })
})
