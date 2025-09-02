/**
*/
export default defineEventHandler(async event => {
  const log = useLogger('ics')
  const  { icsText, includePastEvents = false } = await readBody(event)

  if (!icsText) {
    log.warn('No ICS text received')
    throw createError({ status: 400, message: 'No ICS text received'})
  }

  try {
    const events = parseIcsData(icsText, includePastEvents)
    log.info(`Found ${events.length} event(s)`)
    return { success: true, events }
  } catch (e) {
    log.error('ICS error', e)
    throw createError({ status: 500, message: 'Error while parsing ics text' })
  }
})