import type { WhereOptions } from '@sequelize/core'
import { Op, literal, sql } from '@sequelize/core'
import { APUser, Event, Place, Filter, Collection } from './db'
import { DateTime } from 'luxon'
import z from 'zod'
import { publicSettings } from './settings'
import { useLogger } from '../lib/logger'

export const collectionQuerySchema = z.object({
  name: z.string(),
  start: z.coerce.number().default(DateTime.local().toUnixInteger()).optional(),
  end: z.coerce.number().optional(),
  show_recurrent: z.coerce.boolean().default(publicSettings.recurrent_event_visible).optional(),
  show_multidate: z.coerce.boolean().default(true).optional(),
  show_federated: z.coerce.boolean().default(false).optional(),
  limit: z.number().optional(),
  include_description: z.coerce.boolean().optional(),
  page: z.number().optional(),
  older: z.coerce.boolean().optional(),
  reverse: z.coerce.boolean().optional(),
})
export type CollectionQueryType = z.infer<typeof collectionQuerySchema>

/**
 * Transform a Filter into a sequelize conditions + replacements
 * @param {Filter} filter
 * @returns
 * @link https://sequelize.org/docs/v7/querying/raw-queries/#replacements
 * @link https://sequelize.org/docs/v7/querying/select-in-depth/
 */
function filterToConditions(filter: Filter) {
  const conditions: WhereOptions<Event> = []
  const replacements: Record<string, unknown> = {}

  // mtch tags
  // if (filter?.tags?.length) {
  //   conditions.push({
  //     '$Tags.tag$': { [Op.in]: filter.tags }
  //   })
  // }

  if (filter.tags?.length) {
    conditions.push(
      literal(`event.id IN (
        SELECT eventId
        FROM event_tags
        WHERE tagTag IN :tags_${filter.id}
      )`)
    )
    replacements[`tags_${filter.id}`] = sql.list(filter.tags)
  }

  if (filter.places?.length) {
    conditions.push({
      placeId: { [Op.in]: filter.places.map((p: Place) => p.id) }
    })
  }

  if (filter.actors?.length) {
    // search for local instance
    if (filter.actors.find(a => a.ap_id === null)) {
      conditions.push({ [Op.or]: [{ apUserApId: filter.actors.map(a => a.ap_id).filter(a => a) }, { apUserApId: null }] })
    } else {
      conditions.push({ apUserApId: filter.actors.map(a => a.ap_id) })
    }
  }

  return { conditions, replacements }
}

export async function getCollectionEvents(opts?: CollectionQueryType) {
  const log = useLogger('collections')
  const args = collectionQuerySchema.parse(opts)

  // get the collection from specified name
  const collection = await Collection.findOne({ where: { name: args.name }, raw: true })
  if (!collection) {
    log.warn(`"%s" not found`, args.name)
    throw createError({ statusCode: 404, statusMessage: 'Not found' })
  }

  // and all related filters
  const filters = await Filter.findAll({ where: { collectionId: collection.id } })

  // collection is empty if there are no filters
  if (!filters.length) {
    log.debug('[COLLECTION] This collection has no filter!')
    return []
  }

  // init stardard filter
  const where: WhereOptions<Event> = {
    // do not include parent recurrent event
    // recurrent: JSON_NULL,

    // confirmed event only
    is_visible: true,

    [Op.or]: {
      start_datetime: { [args.older ? Op.lte : Op.gte]: args.start },
      end_datetime: { [args.older ? Op.lte : Op.gte]: args.start }
    },
    ...(args.end && { start_datetime: { [args.older ? Op.gte : Op.lte]: args.end } }),

    // include recurrent events?
    ...(!args.show_recurrent && { parentId: null }),
  }

  let replacements: Record<string, unknown> = {}
  const conditions: WhereOptions<Event> = []
  const negatedConditions: WhereOptions<Event> = []

  // collections are a set of filters to match
  filters.forEach((f) => {
    const { conditions: tmpConditions, replacements: tmpReplacements } = filterToConditions(f)
    replacements = { ...replacements, ...tmpReplacements }
    if (!tmpConditions.length) return
    if (f.negate) {
      negatedConditions.push(tmpConditions.length === 1 ? tmpConditions[0] : { [Op.and]: tmpConditions })
    } else {
      conditions.push(tmpConditions.length === 1 ? tmpConditions[0] : { [Op.and]: tmpConditions })
    }
  })

  if (negatedConditions.length) {
    where[Op.not] = negatedConditions
  }

  if (conditions.length) {
    where[Op.or] = conditions
  }

  return Event.findAll({
    where,
    attributes: {
      exclude: ['likes', 'boost', 'userId', 'is_visible', 'placeId',
        'createdAt']
    },
    order: [['start_datetime', opts?.reverse ? 'DESC' : 'ASC']],
    include: [
      {
        model: Tag,
        // order: [Sequelize.literal('(SELECT COUNT("tagTag") FROM event_tags WHERE tagTag = tag) DESC')],
        attributes: ['tag'],
        through: { attributes: [] }
      },
      { model: Place, required: true, attributes: ['id', 'name', 'address', 'latitude', 'longitude'] },
      { model: APUser, required: false, attributes: ['object'], as: 'APUser' }
    ],
    ...(opts?.limit && { limit: args.limit }),
    ...(opts?.page && args.limit && { offset: opts.page * args.limit }),
    logging: console.log,
    replacements
  }).catch((e) => {
    log.error('[EVENT]', e)
    return []
  })
}
