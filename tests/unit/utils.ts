import { vi } from 'vitest'
import { DateTime } from 'luxon'
import { Readable } from 'node:stream'
import { IncomingMessage, ServerResponse } from 'node:http'
import { createEvent } from 'h3'


export function mockH3Event({ body = null, method = 'POST', url = '/', query = {}, headers = {} } = {}) {
  // build query string
  const qs = new URLSearchParams(query).toString()
  
  const req = new IncomingMessage(null as any)
  req.method = method
  req.url = qs ? `${url}?${qs}` : url

  if (body) {
    const json = JSON.stringify(body)

    // simulate request stream
    const stream = Readable.from([Buffer.from(json)])
    Object.assign(req, stream)

    req.headers = {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(json).toString(),
      ...headers,
    }
  }

  const res = new ServerResponse(req)
  return createEvent(req, res)
}


// export function mockH3Event({
//   body,
//   method = 'POST',
//   headers = {},
//   params = {},
//   rawBody
// }) {
//   return new H3Event({
//     context: { params },
//     node: {
//       req: {
//         headers,
//         method,
//         url: '/inbox'
//       }
//     },
//     __body: body,
//     __rawBody: rawBody || JSON.stringify(body)
//   })
// //   return {
// //     context: { params },
// //     node: {
// //       req: {
// //         headers,
// //         method,
// //         url: '/inbox'
// //       }
// //     },
// //     __body: body,
// //     __rawBody: rawBody || JSON.stringify(body)
// //   }
// // }

// export function mockH3() {
//   return vi.mock('h3', async () => {
//     const actual = await vi.importActual<any>('h3')
//     return {
//       ...actual,
//       readBody: (event) => event.__body,
//       readRawBody: (event) => Buffer.from(event.__rawBody),
//       getHeader: (event, name) => event.node.req.headers[name.toLowerCase()]
//     }
//   })
// }

export function now() {
  return DateTime.now().toUnixInteger()
}
