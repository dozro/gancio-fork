import { defineEventHandler } from 'h3'
import { pluginController } from '~~/server/services'

export default defineEventHandler(async (evt) => {
  return pluginController.routeAPI(evt)
})