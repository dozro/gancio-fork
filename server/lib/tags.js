import { Op, col, where, fn } from '@sequelize/core'
import { useLogger } from '../utils/useLogger'
const log = useLogger('tags')

export async function cleanOrphanTags () {
    const tags = await Tag.findAll({
      include: [{ model: Event, as: 'events', required: false, attributes: [], through: { attributes: [] } }],
      group: ['tag.tag'],
      having: where(fn('COUNT', col('events.id')), Op.eq, 0)
    })

    if (!tags.length) { return }
    log.info(`Remove ${tags.length} orphan tags (${tags.map(p => p.tag).join(', ')})`)

    await Tag.destroy({
      where: { tag: { [Op.in]: tags.map(p => p.tag) } }
    })
  }