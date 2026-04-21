import { defineEventHandler, readBody, createError } from 'h3'
import { useLogger } from '~~/server/lib/logger'
import { parseIcsData } from '~~/server/services/icsparser'
/**
*/
export default defineEventHandler(async (event) => {
  const log = useLogger('ics')
  const { url, includePastEvents = false } = await readBody(event)

  if (!url) {
    log.warn('No URL provided')
    throw createError({ status: 400, message: 'No URL provided' })
  }

  try {
    const icsText = await fetch(url).then(res => res.text())
    const events = parseIcsData(icsText, includePastEvents)
    log.info(`Found ${events.length} event(s)`)
    return { success: true, events }
  } catch (e) {
    log.error('ICS URL error', e)
    throw createError({ status: 500, message: 'Error while fetching or parsing ics text' })
  }
})