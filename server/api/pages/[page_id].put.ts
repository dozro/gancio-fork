export default defineEventHandler(async event => {
  await requireAdminSession(event)
  const page_id = event.context.params?.page_id
  const body = await readBody(event)
  const page = await Page.findByPk(page_id)

  if (!page) {
    throw createError({ status: 400 })
  }

  return page.update(body)

})