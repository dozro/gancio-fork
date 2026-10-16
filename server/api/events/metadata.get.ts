import { createError, defineEventHandler, getValidatedQuery } from 'h3'
import { z } from 'zod'
import { requireUser } from '~~/server/lib/auth'
import { getFirstZodError } from '~~/server/helpers'
import { findEventsByMetadata, metadataKeySchema, metadataValueSchema } from '~~/server/services/metadata'

const querySchema = z.object({
  key: metadataKeySchema,
  value: metadataValueSchema.optional()
})

/**
 * @openapi
 * /api/events/metadata:
 *   get:
 *     summary: Search events by metadata
 *     description: Find events having a private metadata `key` (and optionally a specific `value`),
 *       e.g. to find an imported event by its source identifier.
 *       Admins and editors search all events, other users only their own events.
 *     parameters:
 *       - name: key
 *         in: query
 *         description: Metadata key.
 *         required: true
 *         example: feed:uid
 *         schema:
 *           type: string
 *       - name: value
 *         in: query
 *         description: Metadata value (exact match).
 *         required: false
 *         example: 1234@example.org
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of matching metadata.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   eventId:
 *                     type: integer
 *                   key:
 *                     type: string
 *                   value:
 *                     type: string
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Events
 */
export default defineEventHandler(async (evt) => {
  const user = await requireUser(evt)

  const { success, error, data } = await getValidatedQuery(evt, querySchema.safeParse)
  if (!success) {
    throw createError({ statusCode: 400, message: getFirstZodError(error) })
  }

  return findEventsByMetadata(data.key, data.value, user)
})
