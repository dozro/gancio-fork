import { defineEventHandler, getRouterParam } from 'h3'
import { getUser } from '~~/server/lib/getUser'
import { Resource } from '~~/server/services'

/**
 * List all resources of an event.
 */
export default defineEventHandler(async (evt) => {
  const eventId = getRouterParam(evt, 'id')
  const user = await getUser(evt)
  const isAdminOrEditor = ['admin', 'editor'].includes(user?.role ?? '')

  const resources = await Resource.findAll({
    where: {
      eventId,
      ...(!isAdminOrEditor && { 'hidden': false, '$APUser.blocked$': false })
    },
    attributes: ['activitypub_id', 'data', 'createdAt', 'updatedAt', 'hidden'],
    include: [
      { association: 'APUser', required: false, attributes: ['ap_id', 'object', 'blocked'] }
    ],
    order: [['createdAt', 'ASC']]
  })
  return resources
})
