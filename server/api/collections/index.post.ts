import { defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { useLogger } from '~~/server/lib/logger'
import { Collection } from '~~/server/services'

/**
  */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const log = useLogger('collections')

  const collection = await readBody(event)
  log.info(collection)
  return Collection.create(collection)
})
