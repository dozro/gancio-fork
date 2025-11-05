export default defineEventHandler(async evt => {
  const log = useLogger('events/tag')
  const tagName = getRouterParam(evt, 'tag')

  if (!tagName) {
    log.warn('Tag not specified')
    throw createError({ status: 404, message: 'Tag not specified' })
  }

  const tag = await Tag.findByPk(tagName)
  if (!tag) {
    log.warn('Tag not found')
    throw createError({ status: 404, message: 'Tag not found' })
  }

  const events = await getEvents({ tags: [tagName], show_federated: true })
  const pastEvents = await getEvents({ tags: [tagName], show_federated: true, older: true, reverse: true })

  return { events, pastEvents }

})
