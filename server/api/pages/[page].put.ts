export default defineEventHandler(async event => {
  await requireAdminSession(event)
  const page_id = Number(getRouterParam(event, 'page'))
  const body = await readBody(event)
  const page = await Page.findByPk(page_id)

  if (!page) {
    throw createError({ status: 400 })
  }

  return page.update(body)

})