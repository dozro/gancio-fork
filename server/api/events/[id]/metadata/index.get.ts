import { defineEventHandler, getRouterParam } from 'h3'
import { requireUser } from '~~/server/lib/auth'
import { getEventMetadata, getModifiableEvent } from '~~/server/services/metadata'

/**
 * @openapi
 * /api/events/{id}/metadata:
 *   get:
 *     summary: Get event metadata
 *     description: Get the private metadata of an event. Metadata are key/value pairs for API clients and plugins
 *       (e.g. a stable identity key of an imported event), they are never shown in the UI nor federated.
 *       Only the owner of the event, editors and admins can access them.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Id of the event.
 *         required: true
 *         example: 1
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event metadata.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EventMetadata'
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
  return getEventMetadata(event.id)
})
