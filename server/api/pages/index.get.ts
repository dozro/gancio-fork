export default defineEventHandler(async (event) => {
  const { user } = await getUserSession(event)
  if (user?.role === 'admin' || user?.role === 'editor') {
    return Page.findAll({ raw: true })
  }
  else {
    return Page.findAll({
      where: { visible: true },
      raw: true
    })
  }
})
