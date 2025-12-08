import z from "zod"

const queryParams = z.object({
  withFilters: z.stringbool().optional().default(false),
  pin: z.stringbool().optional().default(true),
})

export default defineEventHandler(async event => {
  const { withFilters, pin } = await getValidatedQuery(event, queryParams.parse)
  if (withFilters) {
    return Collection.findAll({ include: [Filter], order: [['sortIndex', 'asc']] })
  } else {
    if (pin) {
      return Collection.findAll({ where: { isTop: true }, order: [['sortIndex', 'asc']] })
    } else {
      return Collection.findAll({ order: [['sortIndex', 'asc']] })
    }
  }
})