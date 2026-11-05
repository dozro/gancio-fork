import { defineEventHandler, getRouterParam, readBody, createError } from 'h3'
import { Place } from '~~/server/services'
import { useLogger } from '~~/server/lib/logger'
import { requireAdmin } from '~~/server/lib/auth'

/**
 * @openapi
 * /api/places/{id}:
 *   put:
 *     summary: Update place
 *     description: Update a place, or merge it into another place when the body contains a different `id`.
 *       Merging moves all events to the other place and removes this one. Admin role is required.
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Id of the place to update.
 *         required: true
 *         example: 1
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Place'
 *     responses:
 *       200:
 *         description: Updated place.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Place'
 *       204:
 *         description: Place merged into the other place.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Place does not exist.
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Places
 */
export default defineEventHandler(async (evt) => {
  await requireAdmin(evt)
  const log = useLogger('Update place')
  const id = getRouterParam(evt, 'id')
  const body = await readBody(evt)
  const place = await Place.findByPk(id)
  if (!place) {
    log.warn(`Place not found: ${id}`)
    throw createError({ statusCode: 404 })
  }

  // different ids, merge
  if (Number(body.id) !== place.id) {
    const newPlace = await Place.findByPk(body.id)
    if (!newPlace) {
      log.warn(`Place not found ${body.id}`)
      throw createError({ statusCode: 404 })
    }
    log.info(`Merging place ${newPlace.name} with ${place.name}`)
    // - search for events with old place
    const events = await place.getEvents()
    // - substitute it with the new one
    await place.removeEvents(events)
    await newPlace.addEvents(events)

    return place.destroy()

    // TODO:
    // const filters = await Filter.findAll({ where: { places: { [Op.not]: null } } })
    // filters.
  } else {
    return place.update(body)
  }
})
