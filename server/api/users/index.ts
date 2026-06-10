import { defineEventHandler } from 'h3'
import { requireAdmin } from '~~/server/lib/auth'
import { useLogger } from '~~/server/lib/logger'
import { User } from '~~/server/services'

export default defineEventHandler(async (event) => {
  const log = useLogger('users')
  await requireAdmin(event)
  log.info('Fetching all users')
  return User.findAll()
})