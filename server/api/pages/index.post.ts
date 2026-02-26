import { Page } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const body = await readBody(evt)
  return Page.create(body)
})