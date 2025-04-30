export default defineEventHandler(async event => {
  return Page.findAll({
    where: { visible: true },
    raw: true
  })
})