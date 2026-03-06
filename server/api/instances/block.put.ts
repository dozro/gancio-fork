import z from 'zod'
import { useLogger } from '~~/server/lib/logger'
import { Instance } from '~~/server/services'

const schema = z.object({
  domain: z.string(),
  blocked: z.coerce.boolean()
})

export default defineEventHandler(async (event) => {
  await requireAdminSession(event)

  const log = useLogger('instance')

  const { domain, blocked } = await readValidatedBody(event, schema.parse)

  const instance = await Instance.findByPk(domain)
  if (!instance) {
    log.warn('Instance not found "%s"', domain)
    throw createError({ status: 404, message: 'Instance not found' })
  }

  instance.update({ blocked })
})
