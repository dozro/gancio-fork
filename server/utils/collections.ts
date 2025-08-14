import Sequelize, { Op } from "@sequelize/core"
import { Event } from "./sequelize"
import { DateTime } from "luxon"
import z from "zod"

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

export async function getCollectionEvents(opts?: CollectionQueryType | undefined) {
  const log = useLogger('collections')
  const args  = collectionQuerySchema.parse(opts)

  // get the collection from specified name
  const collection = await Collection.findOne({ where: { name: args.name } })
  if (!collection) {
    log.warn(`"%s" not found`, name)
    return []
  }

  // and all related filters
  const filters = await Filter.findAll({ where: { collectionId: collection.id } })
        
  // collection is empty if there are no filters
  if (!filters.length) {
    log.debug('[COLLECTION] This collection has no filter!')
    return []
  }
        
  // init stardard filter
  const where = {
    // do not include parent recurrent event
    // recurrent: null,

    // confirmed event only
    is_visible: true,
    [Op.or]: {
      start_datetime: { [opts?.older ? Op.lte : Op.gte]: args.start },
      end_datetime: { [opts?.older ? Op.lte : Op.gte]: args.start }
    }
  }
        
  // include recurrent events?
  // if (!opts?.show_recurrent) {
  //   where.parentId = null
  // }

  if (opts?.end) {
    where.start_datetime = { [args.older ? Op.gte : Op.lte]: args.end }
  }

  const replacements = []
  const conditions = []
  const negatedConditions = []

  // collections are a set of filters to match
  filters.forEach(f => {

    let tmpConditions = []

    // if (f.tags && f.tags.length) {
    //   const tags = Sequelize.fn('EXISTS', Sequelize.literal(`SELECT 1 FROM event_tags WHERE 'event_tags.eventId')}=event.id AND ${Col('tagTag')} in (?)`))
    //   replacements.push(f.tags)
    //   tmpConditions.push(tags)
    // }

    if (f.places && f.places.length) {
        tmpConditions.push({ placeId: f.places.map(p => p.id) })
    }

    if (f.actors && f.actors.length) {
      // search for local instance
      if (f.actors.find(a => a.ap_id === null)) {
        tmpConditions.push({ [Op.or]: [{ apUserApId: f.actors.map(a => a.ap_id).filter(a => a)}, { apUserApId: null }]})
      } else {
        tmpConditions.push({ apUserApId: f.actors.map(a => a.ap_id) })
      }
    }

    if (!tmpConditions.length) return
    if (f.negate) {
      negatedConditions.push(tmpConditions.length === 1 ? tmpConditions[0] : { [Op.and]: tmpConditions })
    } else {
      conditions.push(tmpConditions.length === 1 ? tmpConditions[0] : { [Op.and]: tmpConditions })
    }
  })

  where[Op.and] = {
    ...(negatedConditions.length > 0 && { [Op.not]: negatedConditions}),
    ...(conditions.length > 0 && { [Op.or]: conditions })
  }

  const events = await Event.findAll({
    where,
    attributes: {
      exclude: ['likes', 'boost', 'userId', 'is_visible', 'placeId', 'apUserApId',
        'createdAt', 'resources', 'ap_object', ...(!args.include_description ? ['description'] : [])]
    },
    order: [['start_datetime', opts?.reverse ? 'DESC' : 'ASC']],
    include: [
      {
        model: Tag,
        // order: [Sequelize.literal('(SELECT COUNT("tagTag") FROM event_tags WHERE tagTag = tag) DESC')],
        attributes: ['tag'],
        through: { attributes: [] }
      },
      { model: Place, required: true, attributes: ['id', 'name', 'address'] },
      // { model: APUser, required: false, attributes: ['object'] }
    ],
    ...( opts?.limit && { limit: args.limit }),
    ...( opts?.page && args.limit && { offset: args.page * args.limit }),
    replacements
  }).catch(e => {
    log.error('[EVENT]', e)
    return []
  })

  return events
}

        //     return events.map(e => {
        //       e = e.get()
        //       e.tags = e.tags ? e.tags.map(t => t && t.tag) : []
        //       if (!e.multidate) {
        //         delete e.multidate
        //       }
        //       if (!e.image_path) {
        //         delete e.image_path
        //       }
        //       if (!e.recurrent) {
        //         delete e.recurrent
        //       }
        //       if (!e.parentId) {
        //         delete e.parentId
        //       }
        //       if (e.ap_user) {
        //         e.ap_user = { image: e.ap_user?.object?.icon?.url ?? `${e.ap_user?.url}/favicon.ico` }
        //       }
        //       return e
        //     })
        
        //   },