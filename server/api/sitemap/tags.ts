import { defineEventHandler } from 'h3'
import { Tag } from '~~/server/services'
export default defineEventHandler(async () => {
  const tags = await Tag.findAll({
    attributes: ['tag'],
    raw: true
  })

  const urls = tags.map(e => ({
    loc: `/tag/${e.tag}`
  }))

  return urls
})