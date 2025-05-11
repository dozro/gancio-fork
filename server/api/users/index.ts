export default defineEventHandler(async (event) => {
  const log = useLogger('users')
  await requireUserSession(event)
  log.info('Fetching all users')
  return User.findAll()
})
