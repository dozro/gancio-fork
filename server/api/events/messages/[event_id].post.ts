import { Event } from "#imports"
import { parseMultipartFormData } from "~/server/utils/parseMultipartForm"

export default defineEventHandler(async event => {
  const log = useLogger('event')
  const form = await parseMultipartFormData(event) as Event
  if (!form) return
  log.info(form)
  
  const ev = await Event.create( { title: form?.title } )
  console.error(ev)
  return
})