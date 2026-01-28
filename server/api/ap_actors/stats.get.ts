import { Op } from '@sequelize/core'
import { APUser, Event, Resource, Instance } from '~~/server/services'

export default defineEventHandler(async () => {
  const n_followers = await APUser.count({ where: { follower: true }, include: [Instance] })
  const n_events = await Event.count({ where: { ap_id: { [Op.not]: null } } })
  const n_resources = await Resource.count()
  return ({ n_followers, n_events, n_resources })
})