import { Op, col, where, fn } from '@sequelize/core'
import { useLogger } from '../utils/useLogger'
const log = useLogger('tags')

export async function findOrCreateTags (tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return []
  }

  // Normalize input tags
  const trimmedTags = tags.map(t => t.trim()).filter(Boolean)
  const lowercasedTags = trimmedTags.map(t => t.toLowerCase())

  // Fetch all tags, then match manually
  const existingTags = await Tag.findAll()

  const existingTagMap = new Map(
    existingTags.map(tag => [tag.tag.toLowerCase(), tag])
  )

  const seen = new Set()
  const newTagsData = trimmedTags.reduce((acc, t) => {
    const lower = t.toLowerCase()
    if (!existingTagMap.has(lower) && !seen.has(lower)) {
      seen.add(lower)
      acc.push({ tag: t })
    }
    return acc
  }, [])
  const createdTags = await Tag.bulkCreate(newTagsData, { returning: true })

  return [
    ...existingTags.filter(t => lowercasedTags.includes(t.tag.toLowerCase())),
    ...createdTags
  ]
}

export async function cleanOrphanTags () {
  const tags = await Tag.findAll({
    include: [{ model: Event, as: 'events', required: false, attributes: [], through: { attributes: [] } }],
    group: ['tag'],
    having: where(fn('COUNT', col('events.id')), Op.eq, 0)
  })

  if (!tags.length) {
    return
  }
  log.info(`Remove ${tags.length} orphan tags (${tags.map(p => p.tag).join(', ')})`)

  await Tag.destroy({
    where: { tag: { [Op.in]: tags.map(p => p.tag) } }
  })
}
