import { Place } from '~~/server/services'

export default defineEventHandler(async () => {
  const places = await Place.findAll({
    attributes: ['name', 'id'],
    raw: true
  })

  const urls = places.map(e => ({
    loc: `/place/${e.id}/${e.name}`,
  }))

  return urls
})