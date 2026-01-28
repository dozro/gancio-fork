import { Op } from '@sequelize/core'
import { useLogger } from '~~/server/lib/logger'
import { Collection } from '~~/server/services'

/**
 * move up a collection by swapping its sortIndex with the one above it.
 * @auth
 */
export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const log = useLogger('collection moveup')
  const sortIndex = Number(getRouterParam(event, 'index'))

  try {
    const collections = await Collection.findAll({ where: { sortIndex: { [Op.lte]: sortIndex } }, limit: 2, order: [['sortIndex', 'desc']] })
    if (collections.length !== 2) {
      throw createError({ status: 404 })
    }

    const tmpSortIndex = collections[0].sortIndex
    await collections[0].update({ sortIndex: collections[1].sortIndex })
    await collections[1].update({ sortIndex: tmpSortIndex })

    return sendNoContent(event, 200)
  } catch (e) {
    log.error(e)
    throw createError({ status: 404 })
  }
})
