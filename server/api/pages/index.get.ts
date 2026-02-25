import { Page } from '~~/server/services'
export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  return Page.findAll()
})