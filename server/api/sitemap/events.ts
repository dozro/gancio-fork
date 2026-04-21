import { defineEventHandler } from 'h3'
import { Event } from '~~/server/services'

export default defineEventHandler(async () => {
  const events = await Event.findAll({
    where: { is_visible: true },
    attributes: ['slug', 'updatedAt'],
    raw: true
  })
  const urls = events.map(e => ({

    loc: `/event/${e.slug}`,
    lastmod: e.updatedAt instanceof Date
      ? e.updatedAt.toISOString()
      : new Date(e.updatedAt).toISOString()
  }))

  return urls
})