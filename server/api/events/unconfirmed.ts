import { Event } from "#imports"
import { Cast, fn, col, sql } from "@sequelize/core"
import { DateTime } from "luxon"

/** get all unconfirmed events
*/
export default defineEventHandler(async event => {
  requireUserSession(event)
  const log = useLogger('event/unconfirmed')
  try {
    const events = await Event.findAll({
      where: {
        parentId: null,
        is_visible: false,
      },
      // attributes: {
      //   include: [
      //     [ sql.cast( sql.fn('COUNT', sql.col('messages.id')), 'INTEGER' ), 'n_messages' ]
      //   ],
      // },
      order: [['start_datetime', 'ASC']],
      include: [
        Place,
        // { model: Message, required: false, attributes: [] }],
      ],
      group: ['event.id', 'place.id'],
    })
    
    const now = DateTime.local().toUnixInteger()
    return ({ events: events.filter(e => e.start_datetime >= now) , oldEvents: events.filter(e => e.start_datetime < now) })
  } catch (e) {
    log.info(String(e))
    throw createError({ statusCode: 400, statusMessage: String(e) })
  }
})
