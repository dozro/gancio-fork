import { getPlaceEvents } from "~~/server/utils/place"
/**
* 
*/
import { z } from 'zod'
// const schema = z.object({
//   placeId: z.coerce.number()
// })
export default defineEventHandler(async event => {
  const { place } = getRouterParams(event)
  if (place) {
    return getPlaceEvents(place)
  } else {
    throw createError({ status: 404, message: 'Not found' })
  }
})
