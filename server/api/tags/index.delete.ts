import { useLogger } from '~~/server/lib/logger'
import { Tag } from '~~/server/services'
import { z } from 'zod'
const schema = z.object({
  tag: z.string()
})

/**
 * Delete a tag
 * @auth
 * @param {string} tag - Original tag
 */
export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const log = useLogger('tag remove')
  const { tag: tagName } = await readValidatedBody(evt, schema.parse)

  const tag = await Tag.findByPk(tagName)
  if (!tag) {
    log.error('This tag does not exist: ', tagName)
    throw createError({ status: 404, message: 'This tag does not exists' })
  }

  log.info(`Remove tag "${tagName}"`)
  return tag.destroy()
})