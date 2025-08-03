// import { APUser } from "~/server/utils/sequelize"

import { Event } from "#imports"
import { Op } from "@sequelize/core"

export default defineCachedEventHandler(async evt => {
    const n_followers = await APUser.count({ where: { follower: true }, include: [Instance]})
    const n_events = await Event.count({ where: { ap_id: { [Op.not]: null } } })
    const n_resources = await Resource.count()
    return ({ n_followers, n_events, n_resources })
})
