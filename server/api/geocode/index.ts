import { defineEventHandler, createError, getValidatedQuery } from 'h3'
import { z } from 'zod'
import { queryNominatim } from '~~/server/services/geocode'
import { publicSettings } from '~~/server/services'

const schema = z.object({
  q: z.string()
})

export default defineEventHandler(async (event) => {
  if (!publicSettings.allow_geolocation) {
    throw createError({ statusCode: 403, message: 'Geocoding is not enabled' })
  }
  const { q } = await getValidatedQuery(event, schema.parse)
  return queryNominatim(q)
})
