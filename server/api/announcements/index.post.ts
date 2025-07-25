
export default defineEventHandler(async evt => {
  const log = useLogger('announcement')
  const body = await readBody(evt)
  return Announcement.create(body)
})