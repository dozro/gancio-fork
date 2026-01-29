import { useLogger } from '~~/server/lib/logger'
import { User } from '~~/server/services'
export default defineEventHandler(async (event) => {
  const log = useLogger('users')
  await requireAdminSession(event)
  log.info('Fetching all users')
  return User.findAll()
})