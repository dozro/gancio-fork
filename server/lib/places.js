import { Op, col, where, fn } from '@sequelize/core'
  
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
  if (!place_name || !place_address && place_name?.toLocaleLowerCase() !== 'online') {
    throw createError({ status: 400, message: 'place_id or place_name and place_address are required' })
  }
  
  let place = await Place.findOne({ where: where(fn('LOWER', col('name')), Op.eq, place_name.toLocaleLowerCase()) })
  if (!place) {
    place = await Place.create({
      name: place_name,
      address: place_address || '',
      ...( body.place_ap_id && { ap_id: body.place_ap_id }),
      ...( body.place_latitude && body.place_longitude && ({ latitude: Number(body.place_latitude), longitude: Number(body.place_longitude) }))
    }).catch(e => {
      console.error(e)
      console.error(e?.errors)
    })
  }
  return place
}