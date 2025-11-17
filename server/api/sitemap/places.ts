import { defineSitemapEventHandler, Place } from '#imports'
import type { SitemapUrlInput } from '#sitemap/types'

export default defineSitemapEventHandler(async () => {

  const places = await Place.findAll({
    attributes: ['name', 'id'],
    raw: true
  })

  const urls: SitemapUrlInput[] = places.map(e => ({
    loc: `/place/${e.id}/${e.name}`,
  }))

  return urls

})
