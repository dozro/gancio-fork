import { defineEventHandler, readBody, createError } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { useLogger } from '~~/server/lib/logger'
import { Filter } from '~~/server/services'

/**
  */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const log = useLogger('filter')

  const filter = await readBody(event)
  log.info(filter)

  try {
    return Filter.create(filter)
  } catch (e) {
    throw createError({ status: 400, message: String(e) })
  }
})