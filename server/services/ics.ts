import { DateTime } from 'luxon'
import type { ICalAlarmData, ICalLocation } from 'ical-generator'
import ical, { ICalCalendarMethod, ICalEventStatus } from 'ical-generator'
import { type H3Event, setHeader, createError } from 'h3'
import type { Event, EventStatus } from './db'
import { htmlToText } from 'html-to-text'
import { publicSettings } from './settings'

/**
 * Send an ics of specified events (optionally with reminders)
 * @param {Event[]} events array of events from sequelize
 * @param {*} alarms https://sebbo2002.github.io/ical-generator/develop/reference/classes/ICalAlarm.html (alarms)
 */
export function exportICS(evt: H3Event, events: Event[], alarms?: ICalAlarmData[]) {
  const statusMap: Record<EventStatus, ICalEventStatus> = {
    EventCancelled: ICalEventStatus.CANCELLED,
    EventTentative: ICalEventStatus.TENTATIVE,
    EventScheduled: ICalEventStatus.CONFIRMED,
    EventMovedOnline: ICalEventStatus.CONFIRMED,
    EventPostponed: ICalEventStatus.TENTATIVE,
    EventRescheduled: ICalEventStatus.CONFIRMED
  }
  const cal = ical({
    method: ICalCalendarMethod.PUBLISH,
    scale: 'GREGORIAN'
  })
  cal.ttl(3600)

  setHeader(evt, 'Content-Type', 'text/calendar; charset=UTF-8')
  try {
    events.forEach((e) => {
      const start = DateTime.fromSeconds(e.start_datetime, { zone: 'UTC' })
      const end = DateTime.fromSeconds(e?.end_datetime ?? e.start_datetime + publicSettings.open_ended_event_default_duration * 60 * 60, { zone: 'UTC' })

      const address = e?.place ? `${e.place?.name} - ${e.place?.address}` : e.online_locations?.length ? e?.online_locations?.[0] : ''
      let location: string | ICalLocation | undefined = address
      if (e.place?.latitude && e.place?.longitude) {
        location = {
          title: address,
          geo: { lat: e.place.latitude, lon: e.place.longitude }
        }
      }

      cal.createEvent({
        id: `${e.id}@${publicSettings.hostname}`,
        start: start,
        end: end,
        summary: e.title,
        description: {
          html: e.description,
          plain: htmlToText(e.description)
        },
        location: location,
        url: `${publicSettings.baseurl}/event/${e.slug || e.id}`,
        status: statusMap[e.status as EventStatus],
        categories: e?.tags?.map(t => ({ name: t.tag })),
        created: e.createdAt,
        lastModified: e.updatedAt,
        alarms
      })
    })
    return cal.toString()
  } catch(err) {
    throw createError({ status: 401, message: String(err) })
  }
}
