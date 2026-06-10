import z from 'zod'
import { defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { useLogger } from '~~/server/lib/logger'
import { Announcement } from '~~/server/services'
import { requireAdmin } from '~~/server/lib/auth'

const schema = z.object({
  title: z.string().min(1).max(100),
  announcement: z.string().min(1),
  visible: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const log = useLogger('announcement put')
  const id = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, schema.parse)

  const announcement = await Announcement.findByPk(id)
  if (!announcement) {
    log.warn(`Not found: ${id}`)
    throw createError({ statusCode: 404, message: 'Announcement not found' })
  }
  return announcement.update(body)
})
