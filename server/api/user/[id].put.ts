import { useLogger } from '~~/server/lib/logger'
import { enqueueMail, User, publicSettings } from '~~/server/services'
/**
 * Update user
 * @auth
 * @info when user is activated a confirmation e-mail is sent with a link that allow to choose a password
 */
export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const log = useLogger('user update')
  const id = getRouterParam(evt, 'id')
  const body = await readBody(evt)

  const user = await User.findByPk(id)
  if (!user) {
    log.error('This user does not exist: ', id)
    throw createError({ status: 404, message: 'This user does not exists' })
  }

  log.info(`Update user ${user.email} - ${JSON.stringify(body)}`)
  if ((!user.is_active && body.is_active)) {
    enqueueMail(user.email, 'confirm', { user, config: publicSettings }, publicSettings.instance_locale)
  }

  return user.update(body)
})
