export default defineEventHandler(async event => {
  const page = getRouterParam(event, 'page')
  console.error(page)
  return Page.findOne({
    where: { slug: page, visible: true },
    raw: true
  })
})