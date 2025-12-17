import Negotiator from 'negotiator'

export default defineEventHandler(async (event) => {
  // TODO: use negotiator to redirect in case accept different mime type!

  // const supported = ['text/html', 'application/rss+xml', 'text/calendar']

  // const negotiator = new Negotiator({
  //   headers: {
  //     accept: getHeader(event, 'accept') || ''
  //   }
  // })

  // const agent = getHeader(event, 'user-agent') || ''
  // const best = negotiator.mediaType(supported)
  // console.error(event.path, best, agent)

  // switch (best) {
  //   case 'text/calendar':
  //     return sendRedirect(event, '/events.ics')
  //   case 'application/rss+xml':
  //     return sendRedirect(event, '/events.xml')
  // }
})
