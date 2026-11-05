import { defineEventHandler, createError, readValidatedBody } from 'h3'
import { useLogger } from '~~/server/lib/logger'
import { requireAdmin } from '~~/server/lib/auth'
import { Tag } from '~~/server/services'
import { z } from 'zod'
const schema = z.object({
  tag: z.string()
})

/**
 * @openapi
 * /api/tags:
 *   delete:
 *     summary: Delete tag
 *     description: Delete a tag and remove it from all events. Admin role is required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tag]
 *             properties:
 *               tag:
 *                 type: string
 *                 description: Tag to delete.
 *                 example: concert
 *     responses:
 *       204:
 *         description: Tag deleted.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Tag does not exist.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Tags
 */
export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
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