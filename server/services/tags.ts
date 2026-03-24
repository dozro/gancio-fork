import { Op, col, where, fn } from '@sequelize/core'
import { useLogger } from '../lib/logger'
import { Tag, Event } from './db'
import { getEvents } from './events'
import { publicSettings } from './settings'
import slugify from 'slugify'
const log = useLogger('tags')

export async function findOrCreateTags(tags: string[]) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return []
  }
  
  tags = tags.filter(tag => typeof tag === 'string' && tag.trim().length > 0)
  
  // solitarietà, Solitarietà
  // normalize input tags, remove duplicates (take the first)
  const normalizedTags = new Map<string, string>()
  
  for (const tag of tags) {
    const normalized = normalizeTag(tag)
    if (!normalizedTags.has(normalized)) {
      normalizedTags.set(normalized, tag)
    }
  }
  
  // search for existing tags
  const existingTags = await Tag.findAll({ where: { normalizedTag: { [Op.in]: Array.from(normalizedTags.keys()) } } })
  
  const existingSet = new Set(existingTags.map(t => t.normalizedTag))
  
  // missing tags are the ones that are not in the existing tags
  const missing = []
  for (const normalizedTag of normalizedTags.keys()) {
    if (!existingSet.has(normalizedTag)) {
      missing.push({
        tag: normalizedTags.get(normalizedTag)!,
        normalizedTag: normalizedTag
      })
    }
  }
  
  const createdTags = await Tag.bulkCreate(missing, { returning: true })

  return [
    ...existingTags,
    ...createdTags
  ]
}

export async function cleanOrphanTags() {
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

export async function getTagEvents(tag: string | undefined) {
  if (!tag) {
    throw createError({ status: 404, message: 'Tag not specified' })
  }
  return getEvents({ tags: [tag] })
}

// normalize tags for consistent case/accent-insensitive matching (optional)
export function normalizeTag(tag: string) {
  return slugify(tag, {
    replacement: '',
    trim: true,
    strict: true,
    lower: true,
    locale: publicSettings.instance_locale,
    remove: /[#]/g
  })
  
}
