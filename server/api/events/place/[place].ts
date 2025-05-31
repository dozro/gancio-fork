import { getPlaceEvents } from "~/server/utils/place"
/**
* 
*/
import { z } from 'zod'
const schema = z.object({
  placeId: z.coerce.number()
})
export default defineEventHandler(async event => {
  const { placeId } = await getValidatedRouterParams(event, schema.parse)
  if (placeId) {
      getPlaceEvents(placeId)
  } else {
      throw createError({ status: 404, message: 'Not found' })
  }
})
