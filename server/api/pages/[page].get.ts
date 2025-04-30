export default defineEventHandler(async event => {
  const slug = event.context.params?.page
  return Page.findOne({
    where: { slug, visible: true },
    raw: true
  })
})