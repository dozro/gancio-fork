import { DateTime } from 'luxon'
import type { WhereOptions } from '@sequelize/core'
import { Op, literal, col, where, fn, sql } from '@sequelize/core'
import type { User } from '#auth-utils'

import { htmlToText } from 'html-to-text'
import { z } from 'zod'
import type { EventAPI } from '~~/shared/types/generic'
import type { H3Event } from 'h3'
import { createHash } from 'crypto'
import { Place, Tag, Event, Message, EventStatus } from './db'
import { publicSettings } from './settings'
import type { UserSession } from '../utils/session'
import type { APAttachment, APEvent, APLocation, APTag } from '../federation/types'
import { PlaceToAP } from '../federation/places'
import { useLogger } from '../lib/logger'
import { handleCache } from '../lib/API'
const log = useLogger('services:events')

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
  show_federated: z.coerce.boolean().default(publicSettings.federated_events_in_home).optional(),
  max: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  older: z.coerce.boolean().optional(),
  reverse: z.coerce.boolean().optional(),
  mine: z.coerce.boolean().optional(),
  ap_user_id: z.string().optional(),
  include_unconfirmed: z.coerce.boolean().default(false).optional(),
  include_parent: z.coerce.boolean().default(false).optional(),
  include_description: z.coerce.boolean().default(false).optional(),
  inlude_ap_events: z.coerce.boolean().default(false).optional()
}).transform(o => ({
  ...o,
  ...(o.max && { limit: o.max })
}))

export type EventQueryType = z.infer<typeof eventQuerySchema>
export async function getEvents(opts?: EventQueryType | undefined, user?: User) {
  const args = eventQuerySchema.parse(opts)

  const andConditions: WhereOptions<Event> = [
    {
      [Op.or]: {
        start_datetime: { [args.older ? Op.lte : Op.gte]: args.start },
        end_datetime: { [args.older ? Op.lte : Op.gte]: args.start }
      }
    },
    { // AND
      ...(args.end && { start_datetime: { [args.older ? Op.gte : Op.lte]: args.end } }),

      // include uncondirmed
      ...(!args.include_unconfirmed && { is_visible: true }),

      ...(args.mine && user && { userId: user.id }),

      // include recurrent events?
      ...(!args.show_recurrent && { parentId: null })

      // include parent event
      // ...(!args.include_parent && { recurrent: { [Op.is]: null } })
    }
  ]

  // if (!args.show_multidate) {
  //   condition.multidate = { [Op.not]: true }
  // }

  // // normalize tags
  // if (args.tags) {
  //   args.tags = args.tags.map(t => t.trim())
  // }

  const replacements: { [key: string]: unknown } = {}

  if (args.places) {
    andConditions.push({ placeId: args.places })
  }

  if (args.tags) {
    andConditions.push(sql`event.id IN (SELECT eventId FROM event_tags WHERE tagTag IN  ${sql.list(args.tags)})`)
  }

  if (args.query) {
    replacements.query = args.query
    andConditions.push({
      [Op.or]: [
        where(fn('LOWER', col('title')), Op.like, '%' + args.query + '%'),
        where(fn('LOWER', col('name')), Op.like, '%' + args.query + '%'),
        fn('EXISTS', literal(`SELECT 1 FROM event_tags WHERE event_tags.eventId=event.id AND LOWER(${col('tagTag').identifiers}) = LOWER(:query)`))
      ]
    })
  }

  let pagination = {}
  if (args.limit) {
    pagination = {
      limit: args.limit,
      offset: args.limit * (args?.page ?? 0)
    }
  }

  return Event.findAll({
    where: andConditions,
    attributes: {
      exclude: [
        'likes', 'boost', 'userId', 'createdAt', 'placeId', 'ap_object', 'ap_id'
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
      { model: Place, required: true, attributes: ['id', 'name', 'address', 'latitude', 'longitude'] },
      { association: 'APUser', attributes: ['ap_id', 'object'] }
    ],
    ...pagination,
    replacements
  })

  // return mapEvents(events as Event[])
}

/**
 * get the last modified date of items.
 * this is used to set `Last-Modified` header and to check for non modified 304 result
 */
export function getLastModified(items: readonly { updatedAt: Date }[]) {
  if (!items?.length) {
    return new Date(0)
  }
  const lastModified = items.reduce((last: Date, item) => item.updatedAt > last ? item.updatedAt : last, new Date(0))
  return lastModified
}

export function getMaxLastModifieds(lastModifieds: Array<Date | undefined>) {
  return lastModifieds.reduce((max, current) => {
    if (!max) return current
    if (!current) return max
    return (current > max) ? current : max
  }, undefined)
}

export function mapEvent(event: Event, place?: Place, tags?: Tag[], user?: User): EventAPI {
  const response: EventAPI = {

    id: event.id,
    slug: event.slug,
    status: event.status,

    title: event.title,
    description: event.description,
    media: event.media,

    start_datetime: event.start_datetime,
    end_datetime: event.end_datetime,
    plain_description: htmlToText(event.description),

    place: event?.place?.toJSON() ?? place?.toJSON(),
    online_locations: event.online_locations,
    tags: (event.tags ?? tags)?.map(t => t.tag),
    is_mine: event.userId ? event.userId === user?.id : false,
    is_anon: event.userId === null,
    is_visible: event.is_visible,
    original_url: event?.ap_object?.url ?? event?.ap_id,

    boost: event.boost,
    likes: event.likes
    // TODO
    // n_msgs: event?.,
  }

  if (event?.APUser?.object) {
    response.ap_user = {
      image: event.APUser.object.icon?.url ?? `${event.APUser.object.url}/favicon.ico`,
      name: event.APUser.object.name
    }
  }

  return response
}

export function mapEvents(events: Event[]): EventAPI[] {
  return events.map(e => mapEvent(e))
}

/**
 * Calculate an ETag from a list of generic items using `id`, `updatedAt` and `status` (if present) fields to build the hash
*/
export function calculateEtag(items: readonly { id: number | string, updatedAt: Date, status?: EventStatus }[]): string {
  const base = items
    .map(e => `${e.id}:${e?.status ?? ''}:${e.updatedAt.toISOString()}`)
    .join('|')

  return createHash('sha1').update(base).digest('hex')
}

export async function sendEvents(event: H3Event, events: Event[]) {
  const etag = calculateEtag(events)
  if (await handleCache(event, etag)) return
  return events.map(e => mapEvent(e))
}

export async function getMessages(eventId: number) {
  const event = await Event.findByPk(eventId, { include: [{ model: Message, as: 'messages' }] })
  if (!event) {
    throw createError({ status: 400 })
  }
  return event
}

export function eventToAP(event: Event) {
  const username = publicSettings.instance_name
  const opt = {
    zone: publicSettings.instance_timezone,
    locale: publicSettings.instance_locale
  }

  const datetime = DateTime.fromSeconds(event.start_datetime, opt).toLocaleString({ weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' })

  // https://framagit.org/les/gancio/-/issues/304
  // https://www.w3.org/TR/activitystreams-vocabulary/#dfn-summary
  const summary = `<p>${event.place && event.place.name}, ${datetime}</p>${event.description}`

  let attachment: APAttachment[] = []
  let location: APLocation[] = []

  if (event.online_locations?.length) {
    location = event.online_locations.map(url => ({
      type: 'VirtualLocation',
      url
    }))
    attachment = event.online_locations.map(href => ({
      type: 'Link',
      mediaType: 'text/html',
      name: href,
      href
    }))
  }

  if (event.place?.name !== 'online') {
    location.push(PlaceToAP(event.place))
  }

  if (event?.media?.length) {
    attachment.push({
      type: 'Document',
      mediaType: 'image/jpeg',
      url: `${publicSettings.baseurl}/media/${event.media[0]?.url}`,
      name: event.media[0]?.name || event.title || '',
      focalPoint: event.media[0]?.focalpoint || [0, 0]
    })
  }

  let tags = event.tags?.map(tag => tag.tag) ?? []

  // add default fedi hashtags if needed on local events only
  if (!event.ap_id && publicSettings.default_fedi_hashtags.length) {
    tags = [...new Set([...tags, ...publicSettings.default_fedi_hashtags])]
  }

  const tag: APTag[] = tags?.map(tag => ({
    type: 'Hashtag',
    name: tag,
    href: `${publicSettings.baseurl}/tag/${encodeURIComponent(tag)}`
  })) ?? []

  const e: APEvent = {
    id: event.ap_id ?? `${publicSettings.baseurl}/federation/m/${event.id}`,
    name: event.title,
    url: event?.ap_object?.url ?? event?.ap_object?.id ?? `${publicSettings.baseurl}/event/${event.slug || event.id}`,
    type: 'Event',
    eventStatus: event.status,
    startTime: DateTime.fromSeconds(event.start_datetime, opt).toISO() ?? '',
    ...(event.end_datetime ? { endTime: DateTime.fromSeconds(event.end_datetime, opt).toISO() } : {}),
    location,
    attachment,
    tag,
    published: event.updatedAt,
    updated: event.updatedAt,
    attributedTo: event.ap_object?.attributedTo ?? `${publicSettings.baseurl}/federation/u/${username}`,
    to: ['https://www.w3.org/ns/activitystreams#Public'],
    content: event.description || '',
    summary
  }
  return e
}

export function canModifyEvent(event: Event, user?: UserSession) {
  return !!user && (['admin', 'editor'].includes(user.role) || event.userId !== user.id)
}
