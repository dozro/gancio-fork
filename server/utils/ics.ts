import { DateTime } from "luxon"
import { parseIcsData } from "./icsparser"
import ics from 'ics'
import { H3Event } from "h3"
import { Event } from "./sequelize"

// const htmlToText = require('html-to-text')

const log = useLogger('ics')


/**
 * Send an ics of specified events (optionally with reminders)
 * @param {*} events array of events from sequelize
 * @param {*} alarms https://github.com/adamgibbons/ics#attributes (alarms)
 */
export function exportICS (evt: H3Event, events: Event[], alarms: any = []) {
  const eventsMap = events.map(e => {
    const tmpStart = DateTime.fromSeconds(e.start_datetime, { zone: 'UTC' })
    const start = [ tmpStart.year, tmpStart.month, tmpStart.day, tmpStart.hour, tmpStart.minute ]

    const location = e?.place ? (e.place?.name !== 'online' ? `${e.place?.name} - ${e.place?.address}` : `${e.place?.name} - ${e?.online_locations?.[0]}`) : ''
    const ret = {
      uid: `${e.id}@${publicSettings.hostname}`,
      start,
      startInputType: 'utc',
      endInputType: 'utc',
      title: e.title,
      description: e.description, //htmlToText(e.description),
      htmlContent: e.description && e.description.replace(/\n/g,"<br>"),
      location,
      url: `${publicSettings.baseurl}/event/${e.slug || e.id}`,
      status: 'CONFIRMED',
      categories: e?.tags?.map(t => t.tag || t),
      alarms
    }

    if (e.place?.latitude && e.place?.longitude) {
      ret.geo = { lat: e.place.latitude, lon: e.place.longitude }
    }

    if (e.end_datetime) {
      const tmpEnd = DateTime.fromSeconds(e.end_datetime, { zone: 'UTC' })
      const end = [ tmpEnd.year, tmpEnd.month, tmpEnd.day, tmpEnd.hour, tmpEnd.minute ]
      ret.end = end
    }

    return ret
  })

  setHeader(evt, 'Content-Type', 'text/calendar; charset=UTF-8')
  return ics.createEvents(eventsMap, (err, value) => {
    if (err) {
      throw createError({ status: 401, message: String(err)})
    }
    return value
  })
}



export async function importICSURL (req, res) {
  log.debug('[ICS-IMPORT] Start ICS URL import')
  const { url } = req.body
  if (!url) {
    return res.status(400).json({ success: false, error: 'No URL provided' })
  }

  try {
    const icsText = await fetch(url).then(res => res.text())
    const includePastEvents = req.query.includePastEvents === 'true'
    const events = parseIcsData(icsText, includePastEvents)
    res.json({ success: true, events })
  } catch (err) {
    console.error('ICS URL error:', err)
    res.status(500).json({ success: false, error: 'Error while fetching or parsing ICS data' })
  }
}

// POST /ics-import  mit { icsText: '...raw text...' }
export async function importICSFile (req, res) {
  log.debug('[ICS-IMPORT] POST /api/ics-import ')
  //log.debug(`[ICS-IMPORT] ICS-Text empfangen – Länge: ${req.body.icsText?.length || 0}`)

  const { icsText, includePastEvents } = req.body

  if (!icsText) {
    log.error('[ICS-IMPORT] No ICS text received')
    return res.status(400).json({ success: false, error: 'No ICS text received' })

  }

  try {
    const events = parseIcsData(icsText, includePastEvents === true)
    log.info(`[ICS-IMPORT] Found ${events.length} event(s)`)
    res.json({ success: true, events })
  } catch (err) {
    console.error('ICS error (POST):', err)
    res.status(500).json({ success: false, error: 'Error while try to parse ics text' })
  }
}