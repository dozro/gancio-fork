export default defineEventHandler(async () => {
  return Page.findAll({
    where: { visible: true },
    raw: true
  })
})
