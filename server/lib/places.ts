import { Op, col, where, fn } from '@sequelize/core'
import { Event, Place, Tag, User, Resource, APUser } from '../utils/sequelize'
import { useLogger } from '../utils/useLogger'
import { createError } from 'h3'
const log = useLogger('federation:places')

export async function findOrCreatePlace (body) {
  if (body?.place_id) {
    const place = await Place.findByPk(body.place_id)
    if (!place) {
      throw createError({ status: 404, message: `Place not found` })
    }
    return place
  }

  if (body?.place_ap_id) {
    const place = await Place.findOne({ where: { ap_id: body.place_ap_id } })
    if (place) {
      return place
    }
  }

  const place_name = body.place_name && body.place_name.trim()
  const place_address = body.place_address && body.place_address.trim()
  if (!place_name || (!place_address && place_name?.toLocaleLowerCase() !== 'online')) {
    throw createError({ status: 400, statusMessage: 'place_id or place_name and place_address are required' })
  }

  let place = await Place.findOne({ where: where(fn('LOWER', col('name')), Op.eq, place_name.toLocaleLowerCase()) })
  if (!place) {
    place = await Place.create({
      name: place_name,
      address: place_address || '',
      ...(body.place_ap_id && { ap_id: body.place_ap_id }),
      ...(body.place_latitude && body.place_longitude && ({ latitude: Number(body.place_latitude), longitude: Number(body.place_longitude) }))
    }).catch((e) => {
      console.error(e)
      console.error(e?.errors)
    })
  }
  return place
}

export async function cleanOrphanPlaces () {
  const places = await Place.findAll({
    include: [{ model: Event, as: 'events', required: false, attributes: [] }],
    group: ['Place.id'],
    having: where(fn('COUNT', col('events.id')), Op.eq, 0)
  })
  if (!places.length) {
    return
  }
  log.debug(`Remove ${places.length} unrelated places: %s`, places.map(p => p.name).join(', '))

  const ids = places.map(p => p.id)
  return Place.destroy({
    where: { id: { [Op.in]: ids } }
  })
}
