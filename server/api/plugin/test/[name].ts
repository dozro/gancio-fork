import { pluginController } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  await requireAdminSession(evt)
  const name = getRouterParam(evt, 'name')
  return pluginController.testPlugin(name)
})