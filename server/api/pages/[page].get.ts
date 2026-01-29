import { Page } from '~~/server/services'
export default defineEventHandler(async (event) => {
  const page = getRouterParam(event, 'page')
  const { user } = await getUserSession(event)
  if (user?.role === 'admin' || user?.role === 'editor') {
    return Page.findOne({
      where: { slug: page },
      raw: true
    })
  }
  return Page.findOne({
    where: { slug: page, visible: true },
    raw: true
  })
})