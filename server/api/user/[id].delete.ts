export default defineEventHandler(async event => {
  await requireAdminSession(event)
  const log = useLogger('user delete')
  const id = getRouterParam(event, 'id')

  const user = await User.findByPk(id)
  if (!user) {
    log.error('This user does not exist: ', id)
    throw createError({ status: 404, message: 'This user does not exists' })
  }

  return user.destroy()
})
