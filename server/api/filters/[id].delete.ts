import { useLogger } from '~~/server/lib/logger'
import { Filter } from '~~/server/services'
export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const log = useLogger('filter delete')
  const id = getRouterParam(event, 'id')

  const filter = await Filter.findByPk(id)
  if (!filter) {
    log.error('This filter does not exist: ', id)
    throw createError({ status: 404, message: 'This filter does not exists' })
  }

  return filter.destroy()
})