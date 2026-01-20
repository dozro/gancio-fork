import z from 'zod'

const queryParams = z.object({
  withFilters: z.stringbool().optional(),
  pin: z.stringbool().optional()
})

export default defineEventHandler(async (event) => {
  const { withFilters, pin } = await getValidatedQuery(event, queryParams.parse)
  if (withFilters) {
    return Collection.findAll({ include: [Filter], order: [['sortIndex', 'asc']] })
  } else {
    if (pin) {
      const collections = await Collection.findAll({ where: { isTop: true }, order: [['sortIndex', 'asc']] })
      const lastModified = getLastModified(collections)
      if (!handleCacheHeaders(event, { modifiedTime: lastModified, maxAge: 5 })) {
        return collections
      }
    } else {
      return Collection.findAll({ order: [['sortIndex', 'asc']] })
    }
  }
})
