import { useLogger } from '~~/server/lib/logger'
import { Message, Event, publicSettings, User, notifyAdmins, enqueueMail } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  const log = useLogger('event:moderation')
  if (!publicSettings.enable_moderation) {
    log.error('Disabled')
    throw createError({ status: 403 })
  }

  // await requireAdminSession(evt)
  const eventId = Number(evt.context.params?.event_id)
  const event = await Event.findByPk(eventId, { include: [{ model: User, required: false }], raw: true })
  if (!event) {
    log.warn(`Event does not exists: ${eventId}`)
    throw createError({ statusCode: 404 })
  }

  const body = await readBody(evt)
  const user = await getUser(evt)
  const isMine = user?.id === event.userId
  const isAdminOrEditor = user?.is_editor || user?.is_admin

  if (!isAdminOrEditor && !isMine && !publicSettings.enable_report) {
    log.warn(`Someone not allowed is trying to report an event -> "${event.title}" isMine: ${isMine} `)
    throw createError({ statusCode: 403 })
  }

  const author = isAdminOrEditor ? 'ADMIN' : isMine ? 'AUTHOR' : 'ANON'
  try {
    const message = await Message.create({
      eventId,
      message: body.message,
      is_author_visible: body.is_author_visible || isMine,
      author
    })

    // notify admins
    notifyAdmins('report', { event, message: body.message, author })
    log.info('Report event to admins')

    // notify author
    if (event?.user?.email && body.is_author_visible && !isMine) {
      enqueueMail(event.user.email, 'report', { event, message: body.message, author }) // , TODO publicSettings.locals.locale)
    }

    return message
  } catch (e) {
    log.warn(`[EVENT] ${e}`)
    throw createError({ statusCode: 500 })
  }
})