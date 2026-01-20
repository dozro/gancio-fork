export default defineEventHandler(async (event) => {
  await requireAdminSession(event)
  const log = useLogger('announcement put')
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  const announcement = await Announcement.findByPk(id)
  if (!announcement) {
    log.warn(`Not found: ${id}`)
    throw createError({ statusCode: 404, statusMessage: 'Announcement not found' })
  }

  return announcement.update(body)
})
