import { defineEventHandler, createError } from 'h3'
import { Event, Message } from '~~/server/services'
import { getUser } from '~~/server/lib/getUser'

/**
 * @openapi
 * /api/events/messages/{event_id}:
 *   get:
 *     summary: Get messages event
 *     description: Get messages of an event by id.
 *     parameters:
 *       - name: event_id
 *         in: path
 *         description: Id of the event.
 *         required: true
 *         example: 1
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event's messages.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Message'
 *       403:
 *         description: User is not allowed to read these messages.
 *       404:
 *         description: Event does not exist.
 *     tags:
 *       - Events
 */
export default defineEventHandler(async (evt) => {
  const eventId = Number(evt.context.params?.event_id)
  const event = await Event.findByPk(eventId)
  if (!event) {
    throw createError({ status: 404 })
  }

  const user = await getUser(evt)
  const isAdminOrEditor = ['admin', 'editor'].includes(user?.role ?? '')
  const isOwner = user?.id === event.userId
  if (!isAdminOrEditor && !isOwner) {
    throw createError({ status: 403, statusMessage: 'Forbidden' })
  }

  return Message.findAll({
    where: {
      eventId,
      ...(!isAdminOrEditor && { is_author_visible: true })
    }
  })
})
