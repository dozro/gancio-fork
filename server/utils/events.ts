import { Event, Message } from "./sequelize"
import { DateTime } from 'luxon'
import { Op, literal, col, where, fn, InferAttributes, WhereOptions, SQL_NULL, JSON_NULL } from '@sequelize/core'

import { htmlToText } from 'html-to-text'
import { z } from 'zod'
import { EventAPI } from "~~/shared/types/generic"
import { H3Event } from "h3"
import { createHash } from "crypto"

export const eventQuerySchema = z.object({
  start: z.coerce.number().default(DateTime.local().toUnixInteger()).optional(),
  end: z.coerce.number().optional(),
  query: z.string().optional(),
  tags: z.preprocess((val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') return val.split(',')
    return []
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
}).transform(o => ({
  ...o,
  ...(o.max && { limit: o.max })
}))

export type EventQueryType = z.infer<typeof eventQuerySchema>
export async function getEvents(opts?: EventQueryType | undefined) {
  const args = eventQuerySchema.parse(opts)
  const condition: WhereOptions<Event> = {
    [Op.or]: {
      start_datetime: { [args.older ? Op.lte : Op.gte]: args.start },
      end_datetime: { [args.older ? Op.lte : Op.gte]: args.start }
    },

    ...(args.end && { start_datetime: { [args.older ? Op.gte : Op.lte]: args.end } }),

    // include uncondirmed
    ...(!args.include_unconfirmed && { is_visible: true }),

    // include recurrent events?
    ...(!args.show_recurrent && { parentId: null }),

    // include parent event
    ...(!args.include_parent && { recurrent: JSON_NULL })

  }

  // ...(args.user_id && { userId: args.user_id }),


  // if (args.user_id) {
  //   condition.userId = args.user_id
  // }

  // if (!args.show_multidate) {
  //   condition.multidate = { [Op.not]: true }
  // }

  // // normalize tags
  // if (args.tags) {
  //   args.tags = args.tags.map(t => t.trim())
  // }

  const replacements = []
  // if (args.tags && args.places) {
  //   condition[Op.and] = [
  //     { placeId: args.places },
  //     sql`EXISTS(SELECT 1 FROM event_tags WHERE ${sql.identifier('event_tags', 'eventId')}=${sql.identifier('Event', 'id')} AND ${sql.identifier('tagTag')} in ${sql.list(args.tags)})`
  //   ]

  // } else if (args.tags) {
  //   condition[Op.and] = sql`EXISTS(SELECT 1 FROM event_tags WHERE ${sql.identifier('event_tags', 'eventId')}=${sql.identifier('Event', 'id')} AND ${sql.identifier('tagTag')} in (${sql.list(args.tags)}))`
  // } else if (args.places) {
  //   condition.placeId = args.places
  // }

  if (args.query) {
    replacements.push(args.query)
    condition[Op.or] =
      [
        { title: where(fn('LOWER', col('title')), 'LIKE', '%' + args.query + '%') },
        where(fn('LOWER', col('name')), 'LIKE', '%' + args.query + '%'),
        fn('EXISTS', literal(`SELECT 1 FROM event_tags WHERE ${col('event_tags.eventId')}=${col('event.id')} AND LOWER(${col('tagTag')}) = LOWER(?)`))
      ]
  }

  let pagination = {}
  if (args.limit) {
    pagination = {
      limit: args.limit,
      offset: args.limit * (args?.page ?? 0),
    }
  }

  return Event.findAll({
    where: condition,
    attributes: {
      exclude: [
        'likes', 'boost', 'userId', 'createdAt', 'placeId', 'ap_object', 'ap_id',
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
    // replacements,
  })

  // return mapEvents(events as Event[])
}
/**
 * get the last modified date of items.
 * this is used to set `Last-Modified` header and to check for non modified 304 result
 */
export function getLastModified(items: readonly { updatedAt: Date }[]) {
  if (!items?.length) {
    return undefined
  }
  const lastModified = items.reduce((last: Date, item) => item.updatedAt > last ? item.updatedAt : last, new Date(0))
  lastModified.setMilliseconds(0)
  return lastModified
}

export function mapEvent(event: Event, place?: Place, tags?: Tag[], user?: User): EventAPI {
  const response: EventAPI = {

    id: event?.id,
    slug: event?.slug,

    title: event.title,
    description: event.description,
    media: event.media,

    start_datetime: event.start_datetime,
    end_datetime: event.end_datetime,
    plain_description: htmlToText(event.description),

    place: event?.place?.toJSON() ?? place?.toJSON(),
    tags: (event.tags ?? tags)?.map(t => t.tag),
    is_mine: event.userId === user?.id,
    is_anon: event.userId === null || !event?.user?.is_active,
    is_visible: event.is_visible,
    original_url: event?.ap_object?.url ?? event?.ap_id,

    // TODO
    // n_msgs: event?.,
  }

  if (event.APUser) {
    response.ap_user = { image: event?.APUser?.object?.icon?.url ?? `${event?.APUser?.object?.url}/favicon.ico` }
  }

  return response

}

export function mapEvents(events: Event[]): EventAPI[] {
  return events.map(e => mapEvent(e))
}

/**
 * Calculate an ETag from a list of generic items using `id` and `updatedAt` fields to build the hash
*/
export function calculateEtag(items: readonly { id: number, updatedAt: Date }[]): string {
  const base = items
    .map(e => `${e.id}:${e.updatedAt.toISOString()}`)
    .join('|')

  return createHash('sha1').update(base).digest('hex')
}

export function sendEvents(event: H3Event, events: Event[]) {
  const lastModified = getLastModified(events)
  const etag = calculateEtag(events)

  if (
    !handleCacheHeaders(event, {
      modifiedTime: lastModified,
      etag,
      cacheControls: [
        'stale-while-revalidate=30',
        'stale-if-error=300',
      ],
    })
  ) {
    return events.map(e => mapEvent(e))
  }
}

export async function getMessages(eventId: number) {
  const event = await Event.findByPk(eventId, { include: [{ model: Message, as: 'messages' }] })
  if (!event) {
    throw createError({ status: 400 })
  }
  return event
}
