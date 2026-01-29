import { useLogger } from '~~/server/lib/logger'
import { Filter } from '~~/server/services'
/**
  */
export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const log = useLogger('filter')

  const filter = await readBody(event)
  log.info(filter)

  try {
    return Filter.create(filter)
  } catch (e) {
    throw createError({ status: 400, message: String(e) })
  }
})