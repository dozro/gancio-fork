import { defineEventHandler, readBody } from 'h3'
import { useLogger } from '~~/server/lib/logger'
import { Collection } from '~~/server/services'
import { requireAdminSession } from '~~/server/lib/session'

/**
  */
export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const log = useLogger('collections')

  const collection = await readBody(event)
  log.info(collection)
  return Collection.create(collection)
})
