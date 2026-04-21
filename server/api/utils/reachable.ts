import { defineEventHandler } from 'h3'
import { publicSettings } from '~~/server/services/settings'
export default defineEventHandler(() => {
  return $fetch(`${publicSettings.baseurl}/api/utils/ping`, { timeout: 5000 })
})
