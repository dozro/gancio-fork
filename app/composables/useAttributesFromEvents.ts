import { DateTime } from 'luxon'
/**
  * @description build v-calendar attributes
  * @link https://vcalendar.io/calendar/attributes.html#attributes
  */
export function useAttributesFromEvents(events) {
  if (!events) return []
  const attributes = []
  // const opt = {
  //   zone: 'Europe/Rome', //publicSettings.instance_timezone,
  //   locale: 'it', //i18n.locale || publicSettings.instance_locale || 'en'
  // }
  const now = DateTime.local().toUnixInteger()
  for (const e of events) {
    const tmp = DateTime.fromSeconds(e.start_datetime)
    if (!tmp || !tmp.year) continue
    const start = DateTime.local().set({ year: tmp.year, month: tmp.month, day: tmp.day })
    // merge events with same date
    const key = `${start.month}${start.day}`
    const c = (e.end_datetime || e.start_datetime) < now ? 'vc-past' : ''

    if (e?.multidate === true && e.end_datetime) {
      attributes.push({
        dates: { start: start.toJSDate(), end: DateTime.fromSeconds(e.end_datetime).toJSDate() },
        highlight: {
          start: { fillMode: 'outline' },
          base: { fillMode: 'light' },
          end: { fillMode: 'outline' },
        }
      })
      continue
    }

    const i = attributes.find(a => a.day === key)
    if (!i) {
      attributes.push({
        day: key,
        key: e.id, n: 1,
        dates: start.toJSDate(),
        dot: { color: 'teal', class: c }
      })
      continue
    }

    i.n++
    if (i.n >= 20) {
      i.dot = { color: 'purple', class: c }
    } else if (i.n >= 10) {
      i.dot = { color: 'red', class: c }
    } else if (i.n >= 5) {
      i.dot = { color: 'orange', class: c }
    } else if (i.n >= 3) {
      i.dot = { color: 'yellow', class: c }
    } else {
      i.dot = { color: 'teal', class: c }
    }

  }
  // add a bar to highlight today
  attributes.push({ key: 'today', dates: new Date(), highlight: { color: 'green', fillMode: 'outline' }})

  return attributes
}
