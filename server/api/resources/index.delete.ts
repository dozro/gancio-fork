import { defineEventHandler, readValidatedBody, createError } from 'h3'
import { Resource } from '~~/server/services'
import { useLogger } from '~~/server/lib/logger'
import { requireAdmin } from '~~/server/lib/auth'

import z from 'zod'

const schema = z.object({
  id: z.string()
})

/**
 * Delete resource permanently.
 * @auth
 */
export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  const log = useLogger('/api/resources')
  const body = await readValidatedBody(evt, schema.parse)
  const resource = await Resource.findByPk(body.id)
  if (!resource) {
    log.warn(`Resource not found: ${body.id}`)
    throw createError({ statusCode: 404 })
  }

  resource.destroy()
})
