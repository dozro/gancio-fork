import { createError, defineEventHandler, getRouterParam } from 'h3'
import { requireUser } from '~~/server/lib/auth'
import { getModifiableEvent, metadataKeySchema, removeEventMetadata } from '~~/server/services/metadata'

/**
 * @openapi
 * /api/events/{id}/metadata/{key}:
 *   delete:
 *     summary: Remove event metadata
 *     description: Remove a single private metadata key from an event.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Id of the event.
 *         required: true
 *         example: 1
 *         schema:
 *           type: integer
 *       - name: key
 *         in: path
 *         description: Metadata key to remove.
 *         required: true
 *         example: feed:uid
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metadata removed.
 *       400:
 *         description: Invalid key.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Not authorized user to modify this event.
 *       404:
 *         description: Event or key not found.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Events
 */
export default defineEventHandler(async (evt) => {
  const user = await requireUser(evt)
  const event = await getModifiableEvent(getRouterParam(evt, 'id'), user)

  const { success, data: key } = metadataKeySchema.safeParse(getRouterParam(evt, 'key', { decode: true }))
  if (!success) {
    throw createError({ statusCode: 400, message: 'Invalid metadata key' })
  }

  const removed = await removeEventMetadata(event.id, key)
  if (!removed) {
    throw createError({ statusCode: 404, message: 'Metadata not found' })
  }
  return { success: true }
})
