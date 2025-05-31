// /** Export a feed
// * @param format
// */
// export default defineEventHandler(async event => {
//   // get format param
//   // 
// })

// async export (req, res) {
//     const settings = res.locals.settings
//     const format = req.params.format || 'json'
//     const tags = req.query.tags
//     const places = req.query.places
//     const collection = req.query?.collection ?? settings.collection_in_home
//     const show_recurrent = settings.allow_recurrent_event && queryParamToBool(req.query?.show_recurrent, settings.recurrent_event_visible)

//     const opt = {
//       zone: settings.instance_timezone,
//       locale: settings.instance_locale
//     }

//     const where = {}
//     const yesterday = DateTime.local(opt).minus({day: 1}).toUnixInteger()

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
