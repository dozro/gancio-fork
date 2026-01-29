import { Event, User } from '~~/server/services'
import { useLogger } from '~~/server/lib/logger'
/**
 * Delete a user by id and disassociate all events created by this user
 * @auth admin
 */
export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const log = useLogger('user delete')
  const id = getRouterParam(event, 'id')

  const user = await User.findByPk(id)
  if (!user) {
    log.error('This user does not exist: ', id)
    throw createError({ status: 404, message: 'This user does not exists' })
  }

  await Event.update({ userId: null }, { where: { userId: user.id } })
  return user.destroy()
})