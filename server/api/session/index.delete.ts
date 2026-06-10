import { defineEventHandler } from 'h3'
import { clearUserSession } from '~~/server/lib/session'

export default defineEventHandler(async (event) => {
  return clearUserSession(event)
})