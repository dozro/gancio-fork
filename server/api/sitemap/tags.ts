import { defineSitemapEventHandler, Tag } from '#imports'
import type { SitemapUrlInput } from '#sitemap/types'

export default defineSitemapEventHandler(async () => {

  const tags = await Tag.findAll({
    attributes: ['tag'],
    raw: true
  })

  const urls: SitemapUrlInput[] = tags.map(e => ({
    loc: `/tag/${e.tag}`,
  }))

  return urls

})
