import { defineEventHandler, readBody, createError } from 'h3'
import { useLogger } from '~~/server/lib/logger'
import { Filter } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

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