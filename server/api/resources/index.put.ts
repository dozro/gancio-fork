import { Resource } from '~~/server/services'
import { useLogger } from '~~/server/lib/logger'
import z from 'zod'

const schema = z.object({
  id: z.string(),
  hidden: z.coerce.boolean()
})

/**
 * Update a resource hidden state.
 * @auth
 */
export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const log = useLogger('/api/resources')
  const body = await readValidatedBody(evt, schema.parse)
  const resource = await Resource.findByPk(body.id)
  if (!resource) {
    log.warn(`Resource not found: ${body.id}`)
    throw createError({ statusCode: 404 })
  }

  resource.update({ hidden: Boolean(body.hidden) })
})
