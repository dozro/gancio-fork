import z from 'zod'
import { handleCache } from '~~/server/lib/API'
import { Collection, Filter } from '~~/server/services'

const queryParams = z.object({
  withFilters: z.stringbool().optional(),
  pin: z.stringbool().optional()
})

/**
 * Retrieve collections
 * @param {boolean} withFilters - Whether to include filters in the response (used in admin panel).
 * @param {boolean} pin - Only retrieve collections that are pinned (used in homepage).
 * @returns {Collection[]} - An array of collections.
 */
export default defineEventHandler(async (evt) => {
  const { withFilters, pin } = await getValidatedQuery(evt, queryParams.parse)


  if (withFilters) {
    return Collection.findAll({ include: [Filter], order: [['sortIndex', 'asc']] })
  } else {
    if (await handleCache(evt, Collection)) return
    if (pin) {
      return Collection.findAll({ where: { isTop: true }, attributes: ['id', 'name'], order: [['sortIndex', 'asc']] })
    } else {
      return Collection.findAll({ order: [['sortIndex', 'asc']] })
    }
  }
})
