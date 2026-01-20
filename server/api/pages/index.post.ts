export default defineEventHandler(async (evt) => {
  // const log = useLogger('page')
  await requireAdminSession(evt)
  const body = await readBody(evt)
  return Page.create(body)
})
