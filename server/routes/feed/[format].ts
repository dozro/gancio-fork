import { DateTime } from "luxon"
import { exportICS } from "~~/server/utils/ics"
import { exportFeed } from "~~/server/utils/rss"

export default defineCachedEventHandler(async evt => {
  const format = getRouterParam(evt, 'format')
  const {tags, places, collection, show_recurrent } = getQuery(evt)
  
  const opt = {
    zone: publicSettings.instance_timezone || 'Europe/Rome',
    locale: publicSettings.instance_locale || 'en-US'
  }

  const yesterday = DateTime.local(opt).minus({day: 1}).toUnixInteger()

  let events
  if (collection) {
    events = await getCollectionEvents({ name: collection })
  } else {

    events = await getEvents({ start: yesterday, tags, places, show_recurrent })
  }
  

  switch (format) {
    case 'rss':
    case 'feed':
      return exportFeed(evt, events.slice(0, 20))
    case 'ics':
      return exportICS(evt, events)
    case 'json':
      return events
  }
  throw createError({ status: 400, message: 'Please specify a valid format: rss, feed, ics or json' })
})



//     if (!collection) {

//       if (tags && places) {
//         where[Op.or] = {
//           placeId: places ? places.split(',').map(Number).filter(a => a) : [],
//           '$tags.tag$': tags.split(',')
//         }
//       }

//       if (tags) {
//         where['$tags.tag$'] = tags.split(',')
//       }

//       if (places) {
//         where.placeId = places.split(',').map(Number).filter(a => a)
//       }

//     }

//     if (!show_recurrent) {
//       where.parentId = null
//     }

//     let events = []

//     if (collection) {
//       events = await collectionController._getEvents({ name: collection })
//     } else {
//       events = await Event.findAll({
//         order: ['start_datetime'],
//         attributes: { exclude: ['is_visible', 'recurrent', 'createdAt', 'likes', 'boost', 'userId', 'placeId'] },
//         where: {
//           is_visible: true,
//           recurrent: null,
//           apUserApId: null,
//           start_datetime: { [Op.gte]: yesterday },
//           ...where
//         },
//         include: [
//           {
//             model: Tag,
//             order: [literal('(SELECT COUNT("tagTag") FROM event_tags WHERE tagTag = tag) DESC')],
//             attributes: ['tag'],
//             required: !!tags,
//             through: { attributes: [] }
//           },
//           { model: Place, attributes: ['name', 'id', 'address'] }]
//       })
//     }

//     switch (format) {
//       case 'rss':
//       case 'feed':
//         return exportController.feed(req, res, events.slice(0, 20))
//       case 'ics':
//         return exportController.ics(req, res, events)
//       case 'json':
//         return res.json(events)
//     }
//     return res.send('Please specify a valid format: rss, feed, ics or json').status(404)
//   },
