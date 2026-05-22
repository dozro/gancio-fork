import { DateTime } from 'luxon'
import type { InferAttributes, WhereOptions } from '@sequelize/core'
import { Op, literal, col, where, fn, sql } from '@sequelize/core'

import { htmlToText } from 'html-to-text'
import { z } from 'zod'
import type { EventAPI, User } from '~~/shared/types/generic'
import { type H3Event, createError } from 'h3'
import { createHash } from 'crypto'
import { Place, Tag, Event, Message, type EventStatus } from './db'
import { publicSettings } from './settings'
import type { UserSession } from '../lib/session'
import { EventStatusEnum, PostalAddressSchema, type APAttachment, type APEvent, type APLocation, type APTag } from '../federation/types'
import { PlaceToAP } from '../federation/places'
import { handleCache } from '../lib/API'
import { placeToJSON } from './places'
import { getImageFromURL, sanitizeHTML } from '../helpers'
import linkifyHtml from 'linkify-html'
import { multipartFileSchema, saveUploadedEventImage } from '../lib/parseMultipartForm'
import { focalPointSchema, jsonCodec } from '../lib/validator'
import { addressToString } from '../../shared/utils/addressToString'
import { normalizeTag } from './tags'
import { RecurrentSchema } from './recurrent'

export const eventQuerySchema = z.object({
  start: z.coerce.number().default(DateTime.local().toUnixInteger()).optional(),
  end: z.coerce.number().optional(),
  query: z.string().optional(),
  tags: z.preprocess((val) => {
    if (Array.isArray(val)) return val
    if (typeof val === 'string') return val.split(',')
    return []
  }, z.array(z.string().transform(t => normalizeTag(t))).optional()),
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
  include_description: z.coerce.boolean().default(false).optional()
}).transform(o => ({
  ...o,
  ...(o.max && { limit: o.max })
}))

export type EventQueryType = z.infer<typeof eventQuerySchema>
export async function getEvents(opts?: unknown | undefined, user?: User): Promise<Event[]> {
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
      ...(!args.show_recurrent && { parentId: null }),

      // include parent event
      ...(!args.include_parent && { recurrent: or(SQL_NULL, JSON_NULL) })
    }
  ]

  // if (!args.show_multidate) {
  //   condition.multidate = { [Op.not]: true }
  // }

  const replacements: { [key: string]: unknown } = {}

  if (args.places) {
    andConditions.push({ placeId: args.places })
  }

  if (args.tags?.length) {
    andConditions.push(sql`${col('Event.id')} IN (
      SELECT ${col('eventId')}
      FROM ${sql.identifier('event_tags')}
      JOIN ${sql.identifier('tags')} ON ${col('tagTag')} = ${col('tags', 'tag')}
      WHERE ${col('tags', 'normalizedTag')} IN ${sql.list(args.tags)}
    )`)
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
        'likes', 'boost', 'userId', 'createdAt',
        'placeId', 'ap_object', 'ap_id',
        ...(!args?.include_description ? ['description'] : [])
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
      { model: Place, required: false, attributes: ['id', 'name', 'address', 'latitude', 'longitude'] },
      { association: 'APUser', attributes: ['ap_id', 'object'] }
    ],
    ...pagination,
    replacements
  })
}

const MAX_TIMESTAMP = 1000 * 24 * 60 * 60 * 365
const eventAPISchema = z.object({
  title: z.string({ message: 'title required' }).min(1).trim(),
  is_visible: z.stringbool().default(true),
  start_datetime: z.preprocess(val => Number(val),
    z.number({ error: 'start_datetime required' })
      .int()
      .positive()
      .max(MAX_TIMESTAMP, { message: 'start_datetime is too far in the future' })
  ),
  end_datetime: z.preprocess(val => val ? Number(val) : undefined,
    z.number()
      .int()
      .max(MAX_TIMESTAMP, { message: 'end_datetime is too far in the future' })
      .optional()
  ),
  tags: z.array(z.string(), { error: 'tags field must be an array' }).optional(),
  status: z.enum(EventStatusEnum).default('EventScheduled'),
  description: z.preprocess((val) => {
    const str = typeof val === 'string' ? val : val ? String(val) : ''
    try {
      // apply linkify then sanitize the resulting HTML
      return sanitizeHTML(linkifyHtml(str, { target: '_blank', render: { email: (ctx: any) => ctx.content } }))
    } catch {
      return str
    }
  }, z.string().optional()),
  online_locations: z.array(z.string()).optional(),
  // image
  image_name: z.string().optional(),
  image: multipartFileSchema.optional(),
  image_url: z.string().optional(),
  image_focalpoint: focalPointSchema.default([0, 0]),
  // location fields
  place_id: z.coerce.number().int().optional(),
  place_name: z.string().optional(),
  place_postal_address: jsonCodec(PostalAddressSchema).optional(),
  place_address: z.string().optional(),
  place_latitude: z.coerce.number().optional(),
  place_longitude: z.coerce.number().optional(),
  recurrent: jsonCodec(RecurrentSchema).optional()
})
  .refine(data => data.place_id || Boolean(data.place_name && (data.place_address || data.place_postal_address)),
    { message: 'place_id or place_name and place_address are required' })
  .refine(data => data.end_datetime === undefined || data.start_datetime <= data.end_datetime,
    { message: 'start_datetime is greater than end_datetime' })

export function validateEvent(publicSettings: Settings, user?: User) {
  const isAnonymous = !user
  return eventAPISchema
    .refine(() => !(isAnonymous && !publicSettings.allow_anon_event),
      { error: 'Anonymous event update/creation not allowed' })
    .refine(data => !(data.recurrent?.frequency && !publicSettings.allow_recurrent_event),
      { error: 'Recurrent event update/creation not allowed' })
    .refine(data => !(isAnonymous && data.start_datetime < DateTime.local().toUnixInteger()),
      { error: 'Anonymous user cannot create past events' })
    .transform((data) => {
      const address = data.place_postal_address || data.place_address
      const place = {
        ...(data.place_id && { id: data.place_id }),
        name: data.place_name,
        postal_address: data.place_postal_address,
        address: addressToString(address || ''),
        latitude: data.place_latitude,
        longitude: data.place_longitude
      }
      data.is_visible = isAnonymous ? false : data.is_visible
      return { ...data, userId: user?.id, place }
    })
}

export type EventAPIType = z.infer<typeof eventAPISchema>

export async function setEventMedia(eventPayload: EventAPIType) {
  if (eventPayload.image || eventPayload.image_url) {
    const focalpoint = eventPayload.image_focalpoint
    if (!eventPayload.image && eventPayload.image_url && /^https?:\/\//.test(eventPayload.image_url)) {
      return getImageFromURL(
        eventPayload.image_url,
        eventPayload.image_name || eventPayload.title,
        focalpoint
      )
    } else if (eventPayload.image) {
      return saveUploadedEventImage(
        eventPayload.image,
        eventPayload.image_name || eventPayload.title || '',
        focalpoint
      )
    }
  }
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

/**
 * Map an Event model instance to the EventAPI type
 * @param event the Event model instance to map
 * @param options.place the Place associated with the event, if not already included in the event (optional)
 * @param options.tags the Tags associated with the event, if not already included in the event (optional)
 * @param options.user the User for which we want to know if the event is_mine or not (optional)
 */
export function mapEvent(event: Event,
  options?: {
    place?: Place
    tags?: Tag[]
    user?: InferAttributes<User>
  }): EventAPI {
  const response: EventAPI = {
    id: event.id,
    slug: event.slug,
    status: event.status,

    title: event.title,

    media: event?.media ?? [],

    start_datetime: event.start_datetime,
    end_datetime: event.end_datetime,
    place: placeToJSON(event?.place ?? options?.place),

    is_mine: event.userId ? event.userId === options?.user?.id : false,
    is_anon: typeof event.userId === 'undefined' || event.userId === null,
    is_visible: event.is_visible,
    original_url: event?.ap_object?.url ?? event?.ap_id ?? undefined,

    online_locations: event.online_locations,
    tags: (event.tags ?? options?.tags)?.map(t => t.tag),
    boost: event.boost,
    likes: event.likes,
    parent: event?.parent,
    parentId: event.parentId
    // TODO
    // n_msgs: event?.,
  }

  if (event.description) {
    response.description = event.description
    response.plain_description = htmlToText(event.description)
  }

  // remove undefined or empty fields from response
  for (const key of Object.keys(response)) {
    const val = response[key]
    if (val === undefined || val === null || (Array.isArray(val) && val.length === 0)) {
      delete response[key]
      continue
    }
  }

  // add the original AP user if present and not excluded
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
    .map(e => `${e.id}:${e?.status ?? ''}:${e.updatedAt?.toISOString()}`)
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
  const summary = `<p>${event.place?.name ?? ''} ${datetime}</p>${event?.description ?? ''}`

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

  if (event.place && event.place?.name !== 'online') {
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
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      'https://w3id.org/fep/8a8e',
      'https://schema.org',
      'https://w3id.org/security/v1'
    ],
    'id': event.ap_id ?? `${publicSettings.baseurl}/federation/m/${event.id}`,
    'name': event.title,
    'url': event?.ap_object?.url ?? event?.ap_object?.id ?? `${publicSettings.baseurl}/event/${event.slug || event.id}`,
    'type': 'Event' as const,
    'eventStatus': event.status,
    'startTime': DateTime.fromSeconds(event.start_datetime, opt).toISO() ?? '',
    ...(event.end_datetime ? { endTime: DateTime.fromSeconds(event.end_datetime, opt).toISO() } : {}),
    ...(event.ld_signature ? { signature: event.ld_signature } : {}),
    location,
    attachment,
    tag,
    'published': event.updatedAt.toISOString(),
    'updated': event.updatedAt.toISOString(),
    'attributedTo': event.ap_object?.attributedTo ?? `${publicSettings.baseurl}/federation/u/${username}`,
    'to': ['https://www.w3.org/ns/activitystreams#Public'],
    'content': event.description || '',
    // https://fediverse.codeberg.page/fep/fep/044f/
    ...(publicSettings.enable_federation_quoting &&
      { interactionPolicy: { canQuote: { automaticApproval: 'https://www.w3.org/ns/activitystreams#Public' } } }),
    summary
  }

  return e
}

export function canModifyEvent(event: Event, user?: UserSession) {
  return user && (['admin', 'editor'].includes(user.role) || event?.userId === user?.id)
}
