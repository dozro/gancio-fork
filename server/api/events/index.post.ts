import { Event } from "#imports"
import { parseMultipartFormData } from "~~/server/utils/parseMultipartForm"
import { z } from 'zod'

export const eventCreateSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  start_datetime: z.coerce.bigint(),
  end_datetime: z.coerce.bigint(),
  place_id: z.string().optional(),
  place_name: z.string().optional(),
  place_address: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasPlaceId = !!data.place_id;
  const hasNameAndAddress = !!data.place_name && !!data.place_address;

  if (!hasPlaceId && !hasNameAndAddress) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either place_id or both place_name and place_address are required.",
    });
  }
})

/**
 * Add a new event
 * Allow anyone to add an event (anon event has to be confirmed
 * @todo flood protection
 * @category Event
 * @name /api/events
 * @type POST
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
  const log = useLogger('event')

  const user = await getUser(evt)

  log.info('Adding new event')
  const form = await parseMultipartFormData(evt)
  // const form = await readValidatedBody(evt, eventCreateSchema.parse)
  console.error(form)
  if (!form) return
  
  log.info(form)
  
  // validate
  // check required fields
  
  // validate start_datetime and end_datetime
  
  // find or create a place
  
  //
  const eventDetails = {
    title: form?.title,
    start_datetime: form.start_datetime,
    end_datetime: form.end_datetime,
    placeId: form.place_id,
    is_visible: !!user,
    description: form.description,
    
  }
  
  const ev = await Event.create(eventDetails, { raw: true })
  
  // notifyEvent('Create', ev.id)
  
  return ev
})