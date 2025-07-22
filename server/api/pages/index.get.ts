export default defineEventHandler(async event => {
  return Page.findAll({
    raw: true
  })
})