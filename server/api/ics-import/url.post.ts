import { defineEventHandler, readBody, createError } from 'h3'
import { useLogger } from '~~/server/lib/logger'
import { getUser } from '~~/server/lib/getUser'
import { SafeFetchError, describeSafeFetchError, ensureOk, safeFetch } from '~~/server/lib/safeFetch'
import { publicSettings } from '~~/server/services/settings'
import { parseIcsData } from '~~/server/services/icsparser'

const MAX_ICS_SIZE = 5 * 1024 * 1024

/**
 * @openapi
 * /api/ics-import/url:
 *   post:
 *     summary: Get events from URL
 *     description: Convert ICS data from URL to event objects. Anonymous users are allowed only when anonymous events are enabled.
 *       Only http(s) URLs on default ports pointing to public addresses are fetched.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: URL with ICS data.
 *                 example: https://example.org/calendar.ics
 *               includePastEvents:
 *                 type: boolean
 *                 description: Include past events or not.
 *                 example: false
 *     responses:
 *       200:
 *         description: Event objects.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *       400:
 *         description: No URL provided, URL not allowed or not reachable, or not a valid ICS file.
 *       401:
 *         description: Anonymous users are not allowed when anonymous events are disabled.
 *     tags:
 *       - ICS
 */
export default defineEventHandler(async (event) => {
  const log = useLogger('ics')

  const user = await getUser(event)
  if (!user && !publicSettings.allow_anon_event) {
    throw createError({ status: 401, message: 'Unauthorized' })
  }

  const { url, includePastEvents = false } = await readBody(event)

  if (!url || typeof url !== 'string') {
    log.warn('No URL provided')
    throw createError({ status: 400, message: 'No URL provided' })
  }

  let icsText: string
  try {
    const response = ensureOk(await safeFetch(url, { maxSize: MAX_ICS_SIZE, headers: { Accept: 'text/calendar' } }))
    icsText = response.body.toString('utf8')
  } catch (e) {
    log.warn('ICS URL error %s: %s', url, String(e))
    const reason = e instanceof SafeFetchError ? describeSafeFetchError(e) : 'Error while fetching ics'
    throw createError({ status: 400, message: reason })
  }

  try {
    const events = parseIcsData(icsText, includePastEvents)
    log.info(`Found ${events.length} event(s)`)
    return { success: true, events }
  } catch (e) {
    log.warn('ICS parse error %s: %s', url, String(e))
    throw createError({ status: 400, message: 'Not a valid ICS file' })
  }
})