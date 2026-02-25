import { Page } from '~~/server/services'
export default defineEventHandler(async (event) => {
  const page = getRouterParam(event, 'page')
  if (await isSessionRole(event, 'admin')) {
    return Page.findOne({ where: { slug: page } })
  }
  return Page.findOne({ where: { slug: page, visible: true } })
})
