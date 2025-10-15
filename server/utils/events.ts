import { Event, Message } from "./sequelize"
import { DateTime } from 'luxon'
import { Op, literal, col, where, fn, Filterable, InferAttributes, WhereOptions, sql } from '@sequelize/core'

import { z } from 'zod'
export const eventQuerySchema = z.object({
  start: z.coerce.number().default(DateTime.local().toUnixInteger()).optional(),
  end: z.coerce.number().optional(),
  query: z.string().optional(),
  tags: z.preprocess((val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') return val.split(',')
    return [];
  }, z.array(z.string())).optional(),
  places: z.preprocess((val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') return val.split(',')
    if (typeof val === 'number') return [val]
    return []
  }, z.array(z.coerce.number())).optional(),
  show_recurrent: z.coerce.boolean().default(publicSettings.recurrent_event_visible).optional(),
  show_multidate: z.coerce.boolean().default(true).optional(),
  show_federated: z.coerce.boolean().default(false).optional(),
  max: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  older: z.coerce.boolean().optional(),
  reverse: z.coerce.boolean().optional(),
  user_id: z.number().optional(),
  ap_user_id: z.string().optional(),
  include_unconfirmed: z.coerce.boolean().default(false).optional(),
  include_parent: z.coerce.boolean().default(false).optional(),
  include_description: z.coerce.boolean().default(false).optional(),
  inlude_ap_events: z.coerce.boolean().default(false).optional(),
}).transform( o => ({
  ...o,
  ...(o.max && { limit: o.max })
}))

export type EventQueryType = z.infer<typeof eventQuerySchema>
export async function getEvents(opts?: EventQueryType | undefined): Promise<Event[]> {
  const args  = eventQuerySchema.parse(opts)
  const condition = {//} // : WhereOptions<InferAttributes<Event, { omit: never; }>> = {
    [Op.or]: {
      start_datetime: { [args.older ? Op.lte : Op.gte]: args.start },
      end_datetime: { [args.older ? Op.lte : Op.gte]: args.start }
    },
  }

  if (args.user_id) {
    condition.userId = args.user_id
  }

  if (args.include_parent !== true) {
    // do not include _parent_ recurrent event
    // condition.recurrent = null
  }

  if (args.include_unconfirmed !== true) {
    // confirmed event only
    condition.is_visible = true
  }

  // // // include recurrent events?
  if (!args.show_recurrent) {
    condition.parentId = null
  }

  // if (!args.show_multidate) {
  //   condition.multidate = { [Op.not]: true }
  // }

  if (args.end) {
    condition.start_datetime = { [args.older ? Op.gte : Op.lte]: args.end }
  }

  // // normalize tags
  if (args.tags) {
    args.tags = args.tags.map(t => t.trim())
  }

  const replacements = []
  if (args.tags && args.places) {
    condition[Op.and] = [
      { placeId: args.places },
      sql`EXISTS(SELECT 1 FROM event_tags WHERE ${sql.identifier('event_tags', 'eventId')}=${sql.identifier('Event', 'id')} AND ${sql.identifier('tagTag')} in ${sql.list(args.tags)})`
    ]
  
  } else if (args.tags) {
    condition[Op.and] = sql`EXISTS(SELECT 1 FROM event_tags WHERE ${sql.identifier('event_tags', 'eventId')}=${sql.identifier('Event', 'id')} AND ${sql.identifier('tagTag')} in (${sql.list(args.tags)}))`
  } else if (args.places) {
    condition.placeId = args.places
  }

  // if (args.query) {
  //   replacements.push(args.query)
  //   condition[Op.or] =
  //     [
  //       { title: where(fn('LOWER', col('title')), 'LIKE', '%' + args.query + '%') },
  //       where(fn('LOWER', col('name')), 'LIKE', '%' + args.query + '%'),
  //       fn('EXISTS', literal(`SELECT 1 FROM event_tags WHERE ${Col('event_tags.eventId')}=${Col('event.id')} AND LOWER(${Col('tagTag')}) = LOWER(?)`))
  //     ]
  // }

  let pagination = {}
  if (args.limit) {
    pagination = {
      limit: args.limit,
      offset: args.limit * (args?.page ?? 0),
    }
  }

  const events = await Event.findAll({
    where: condition,
    attributes: {
      exclude: [
        'userId', 'createdAt', 'placeId', 'ap_object', 'ap_id',
        ...(!args.include_parent ? ['recurrent']: []),
        ...(!args.include_unconfirmed ? ['is_visible']: []),
        ...(!args.include_description ? ['description']: [])
      ]
    },
    order: [['start_datetime', args.reverse ? 'DESC' : 'ASC']],
    include: [
      {
        model: Tag,
        // order: [sql`(SELECT COUNT(tagTag) FROM event_tags WHERE tagTag = tag) DESC)`],
        attributes: ['tag'],
        through: { attributes: [] }
      },
      { model: Place, required: true, attributes: ['id', 'name', 'address', 'latitude', 'longitude'] }
    ],
    ...pagination,
    replacements,
  }).catch(e => {
    console.error('[EVENT]' + String(e))
    return []
  })

  // return events
  return mapEvents(events)
}


export function mapEvents (events: Event[]) : Event[] {
  return events.map(event => {
    
    const e = event.get()
    e.tags = e.tags ? e.tags.map(t => t && t.tag) : []

    e.end_datetime = Number(e.end_datetime) || null
    
    if (!e.multidate) {
      delete e.multidate
    }
    
    if (!e.image_path) {
      delete e.image_path
    }

    if (!e.recurrent) {
      delete e.recurrent
    }

    if (!e.parentId) {
      delete e.parentId
    }

    if (e.ap_user) {
      e.ap_user = { image: e.ap_user?.object?.icon?.url ?? `${e.ap_user?.url}/favicon.ico` }
    }

    return e
  })
}

export async function getMessages(eventId: number) {
  const event = await Event.findByPk(eventId, { include: [{ model: Message, as: 'messages' } ] })
  if (!event) {
    throw createError({ status: 400 })
  }
  return event
}