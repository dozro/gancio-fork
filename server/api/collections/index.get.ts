export default defineEventHandler(event => {
  const { withFilters, pin } = getQuery(event)
  if (withFilters) {
    return Collection.findAll({ include: [Filter], order: [['sortIndex', 'asc']] })
  } else {
    if (pin) {
      return Collection.findAll({ where: { isTop: true }, order: [['sortIndex','asc']]})
    } else {
      return Collection.findAll({ order: [['sortIndex','asc']]})
    }
  }
})