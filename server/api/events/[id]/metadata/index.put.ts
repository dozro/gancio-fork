import { createError, defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { requireUser } from '~~/server/lib/auth'
import { getFirstZodError } from '~~/server/helpers'
import { getModifiableEvent, metadataPayloadSchema, setEventMetadata } from '~~/server/services/metadata'

/**
 * @openapi
 * /api/events/{id}/metadata:
 *   put:
 *     summary: Set event metadata
 *     description: >-
 *       Create, update or remove private metadata of an event.
 *       Specified keys are created or updated, keys with a `null` value are removed, other keys are left untouched.
 *       Keys can contain only letters, numbers and `_ . : -`, using a prefix (e.g. `myapp:uid`) is recommended to avoid collisions.
 *       Values must be strings.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Id of the event.
 *         required: true
 *         example: 1
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties:
 *               type: string
 *               nullable: true
 *             example:
 *               feed:uid: 1234@example.org
 *               myapp:sync: done
 *               obsolete_key: null
 *     responses:
 *       200:
 *         description: Resulting event metadata.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventMetadata'
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Not authorized user to modify this event.
 *       404:
 *         description: Event not found.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Events
 */
export default defineEventHandler(async (evt) => {
  const user = await requireUser(evt)
  const event = await getModifiableEvent(getRouterParam(evt, 'id'), user)

  const { success, error, data } = await readValidatedBody(evt, metadataPayloadSchema.safeParse)
  if (!success) {
    throw createError({ statusCode: 400, message: getFirstZodError(error) })
  }

  return setEventMetadata(event.id, data)
})
