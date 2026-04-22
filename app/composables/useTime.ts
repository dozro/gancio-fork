import { DateTime } from 'luxon'

export function useTime() {
  const settings = useState<Settings>('settings')
  const { locale } = useI18n()

  // datetime helper to create a datetime from seconds or from ISO string
  // with correct locale and timezone
  function dt(input?: number | string) {
    let date: DateTime
    if (typeof input === 'number') {
      date = DateTime.fromSeconds(input)
    } else if (typeof input === 'string') {
      date = DateTime.fromISO(input)
    } else {
      date = DateTime.local()
    }
    return date
      .setZone(settings.value.instance_timezone)
      .setLocale(locale.value || settings.value.instance_locale)
  }

  function currentYear() {
    return dt().year
  }

  function currentMonth() {
    return dt().month
  }

  function startMonth(year?: number, month?: number) {
    const date = year && month ? dt().set({ year, month }) : dt()
    return date.startOf('month').toUnixInteger()
  }

  function nowUnix() {
    return dt().toUnixInteger()
  }

  function time(datetime: number) {
    return dt(datetime).toString()
  }

  function unixFormat(timestamp: number, format = 'EEEE d MMMM HH:mm') {
    return dt(timestamp).toFormat(format)
  }

  function format(date: string, formatStr = 'EEEE d MMMM HH:mm') {
    return dt(date).toFormat(formatStr)
  }

  function from(timestamp: number) {
    return dt(timestamp).toRelative()
  }

  function when(event: EventAPI) {
    const cy = currentYear()
    const addTimezone = event?.ap_id || event?.place?.name === 'online'

    const start = dt(event?.start_datetime ?? 0)
    let timeStr = start.toLocaleString({
      weekday: 'long',
      ...(cy !== start.year && { year: 'numeric' }),
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      ...(addTimezone && { timeZoneName: 'short' })
    })

    if (event?.end_datetime) {
      const end = dt(event.end_datetime)
      const isMultiDate = !end.hasSame(start, 'day')

      if (isMultiDate) {
        timeStr += ` → ${end.toLocaleString({
          weekday: 'long',
          ...(cy !== end.year && { year: 'numeric' }),
          month: 'short',
          day: '2-digit'
        })}`
      } else if (end.diff(start, 'minutes').minutes > 0) {
        timeStr += `-${end.toLocaleString({ hour: '2-digit', minute: '2-digit' })}`
      }
    }

    return timeStr
  }

  return {
    currentYear,
    currentMonth,
    startMonth,
    nowUnix,
    time,
    unixFormat,
    format,
    from,
    when
  }
}

// recurrentDetail (event, format='EEEE') {
//   const opt = {
//     zone,
//     locale: app.i18n.locale || store.state.settings.instance_locale
//   }
//   const parent = event.parent
//   if (!parent.recurrent || !parent.recurrent.frequency) return 'error!'
//   const { frequency, type } = parent.recurrent
//   let recurrent
//   if (frequency === '1w' || frequency === '2w') {
//     recurrent = app.i18n.t(`event.recurrent_${frequency}_days`, { days: DateTime.fromSeconds(parent.start_datetime, opt).toFormat(format)})
//   } else if (frequency === '1m' || frequency === '2m') {
//     const d = type === 'ordinal' ? DateTime.fromSeconds(parent.start_datetime, opt).day : DateTime.fromSeconds(parent.start_datetime, opt).toFormat(format)
//     if (type === 'ordinal') {
//       recurrent = app.i18n.t(`event.recurrent_${frequency}_days`, { days: d })
//     } else {
//       recurrent = app.i18n.t(`event.recurrent_${frequency}_ordinal`,
//       { n: app.i18n.t('ordinal.' + type), days: d })
//     }
//   }
//   return recurrent
// },