import { defineEventHandler, getRouterParam } from 'h3'
import { sendEvents } from '~~/server/services'
import { getCollectionEvents } from '~~/server/services/collections'

/**
 * @openapi
 * /api/collections/{id}:
 *   get:
 *     summary: Get events
 *     description: Get events of a collection by name.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Name of the collection to get.
 *         required: true
 *         example: collection_test
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Events of the collection with name `id`.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EventAPI'
 *       404:
 *         description: Collection does not exist.
 *     tags:
 *       - Collections
 */
export default defineEventHandler(async (evt) => {
  // https://github.com/nitrojs/nitro/issues/3518
  const name = getRouterParam(evt, 'id', { decode: true }) as string
  return sendEvents(evt, await getCollectionEvents({ name }))
})
