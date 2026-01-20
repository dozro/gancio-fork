export default defineEventHandler(async (evt) => {
  const body = await readBody(evt)
  return Announcement.create(body)
})
