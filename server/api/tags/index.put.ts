import { defineEventHandler, readValidatedBody, createError } from 'h3'
import { z } from 'zod'
import { useLogger } from '~~/server/lib/logger'
import { requireAdmin } from '~~/server/lib/auth'
import { Tag } from '~~/server/services'
import { normalizeTag } from '~~/server/services/tags'
const schema = z.object({
  tag: z.string(),
  newTag: z.string()
})

/**
 * @openapi
 * /api/tags:
 *   put:
 *     summary: Rename tag
 *     description: Rename a tag, or merge it into `newTag` when that tag already exists.
 *       Merging moves all events to the existing tag. Admin role is required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tag, newTag]
 *             properties:
 *               tag:
 *                 type: string
 *                 description: Tag to rename.
 *                 example: concrt
 *               newTag:
 *                 type: string
 *                 description: New tag.
 *                 example: concert
 *     responses:
 *       204:
 *         description: Tag renamed or merged.
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
  const log = useLogger('tag update')
  const { tag, newTag: newTagStr } = await readValidatedBody(evt, schema.parse)

  const oldtag = await Tag.findByPk(tag)
  if (!oldtag) {
    log.error('This tag does not exist: ', tag)
    throw createError({ status: 404, message: 'This tag does not exists' })
  }

  const newTagNormalized = normalizeTag(newTagStr)

  const newtag = await Tag.findByPk(newTagNormalized)
  // if the new tag does not exists, just rename the old one
  if (!newtag) {
    log.info(`Rename tag "${oldtag.tag}" to "${newTagNormalized}"`)
    await Tag.update({ tag: newTagNormalized }, { where: { tag } })
  } else {
    log.info(`Merge tag "${oldtag.tag}" to "${newTagNormalized}"`)
    // in case it exists:
    // - search for events with old tag
    const events = await oldtag.getEvents()
    // - substitute it with the new one
    await oldtag.removeEvents(events)
    await newtag.addEvents(events)
  }
})
