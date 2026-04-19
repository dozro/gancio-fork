import { DateTime } from 'luxon'

function currentMonth () {
  // return DateTime.local({ zone }).month
  return DateTime.local().month
}

function currentYear () {
  return DateTime.local().year
}

function startMonth (year?: number, month?: number) {
  if (year && month) {
    return DateTime.local(year, month).startOf('month').toUnixInteger()
  } else {
    return DateTime.local().startOf('month').toUnixInteger()
  }
}

function nowUnix () {
  return DateTime.local().toUnixInteger()
}

function timeToISO (time: number) {
  return DateTime.local(time).toISO()
}

function time (datetime: number) {
  return DateTime.local(datetime).toString()
}

function when(event: EventAPI) {
  const settings = useState<Settings>('settings')
  const { locale } = useI18n()

  const cy = currentYear()
  const addTimezone = event?.ap_id || event?.place?.name === 'online'

  const opt = {
    zone: settings.value.instance_timezone,
    locale: locale.value || settings.value.instance_locale
  }

  const start = DateTime.fromSeconds(event?.start_datetime ?? 0, opt)
  let time = start.toLocaleString({ weekday: 'long', ...(cy !== start.year && { year: 'numeric' }), month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', ...(addTimezone && { timeZoneName: 'short' }) })
  const end = event?.end_datetime && DateTime.fromSeconds(event?.end_datetime ?? 0, opt)
  if (end) {
    const isMultiDate = !end.hasSame(start, 'day')
    if (isMultiDate) {
      time += ` → ${end.toLocaleString({ weekday: 'long', ...(cy !== end.year && { year: 'numeric' }), month: 'short', day: '2-digit' })}`
    } else if (end.diff(start, 'minutes').minutes > 0) {
      time += `-${end.toLocaleString({ hour: '2-digit', minute: '2-digit' })}`
    }
  }

  return time
}

function unixFormat (timestamp, format = 'EEEE d MMMM HH:mm') {
  // , {
  //   zone: store.state.settings.instance_timezone,
  //   locale: app.i18n.locale || store.state.settings.instance_locale
  // }
  return DateTime.fromSeconds(timestamp).toFormat(format)
}

function format (date, format = 'EEEE d MMMM HH:mm') {
  return DateTime.fromISO(date
  //   {
  //   zone: store.state.settings.instance_timezone,
  //   locale: app.i18n.locale || store.state.settings.instance_locale
  // }
  ).toFormat(format || '')
}

function from (timestamp) {
  const settings = useState<Settings>('settings')
  const { locale } = useI18n()

  const opt = {
    zone: settings.value.instance_timezone,
    locale: locale.value || settings.value.instance_locale
  }
  return DateTime.fromSeconds(timestamp, opt).toRelative()
}

export default { when, currentYear, currentMonth, startMonth, nowUnix, time, timeToISO, unixFormat, format, from }

// timeFormat () {
//   const time = DateTime.fromObject({ hour: 14 }, {
//     zone: store.state.settings.instance_timezone,
//     locale: app.i18n.locale || store.state.settings.instance_locale
//   }).toLocaleString({ hour: 'numeric'})
//   return time === '2 PM' ? 'ampm' : '24hr'
// },

// formatHour (value, format) {
//   if (!value) return ''
//   return DateTime.fromFormat(value, 'HH:mm', {
//     zone: store.state.settings.instance_timezone,
//     locale: app.i18n.locale || store.state.settings.instance_locale
//   }).toLocaleString({ hour: '2-digit', minute: '2-digit'})
// },

// format (date, format) {
//   return DateTime.fromISO(date, {
//     zone: store.state.settings.instance_timezone,
//     locale: app.i18n.locale || store.state.settings.instance_locale
//   }).toFormat(format || '')
// },

// unixFormat (timestamp, format='EEEE d MMMM HH:mm') {
//   return DateTime.fromSeconds(timestamp, {
//     zone: store.state.settings.instance_timezone,
//     locale: app.i18n.locale || store.state.settings.instance_locale
//   }).toFormat(format)
// },

// fromUnix (timestamp) {
//   return DateTime.fromSeconds(timestamp, { zone })
// },

// fromDateInput (date, time) {
//   const [hour, minute] = time.split(':')
//   return DateTime.fromJSDate(date, { zone })
//     .set({ hour: Number(hour), minute: Number(minute), second: 0 })
//     .toUnixInteger()
// },

// when (event) {
//   const currentYear = app.$time.currentYear()
//   const addTimezone = event.ap_id || event.place?.name === 'online'

//   const opt = {
//     zone: store.state.settings.instance_timezone,
//     locale: app.i18n.locale || store.state.settings.instance_locale
//   }

//   const start = DateTime.fromSeconds(event.start_datetime, opt)
//   let time = start.toLocaleString({ weekday: 'long', ...(currentYear !== start.year && { year: 'numeric'}), month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', ...( addTimezone && { timeZoneName: 'short' }) })
//   const end = event.end_datetime && DateTime.fromSeconds(event.end_datetime, opt)
//   if (end) {
//     time += event.multidate ? ` → ${end.toLocaleString({ weekday: 'long', ...(currentYear !== end.year && { year: 'numeric'}), month: 'short', day: '2-digit'})}` : `-${end.toLocaleString({hour: '2-digit', minute: '2-digit'})}`
//   }

//   return time
// },

// nowUnix () {
//   const opt = {
//     zone,
//     locale: app.i18n.locale || store.state.settings.instance_locale
//   }
//   return DateTime.local(opt).toUnixInteger()
// },

// startMonth () { return DateTime.local({ zone }).startOf('month').toUnixInteger() },
// startOfDay (date) { return DateTime.fromJSDate(date, { zone }).startOf('day').toUnixInteger()},
// endOfDay (date) { return DateTime.fromJSDate(date, { zone }).endOf('day').toUnixInteger()},

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

// currentTimestamp () {
//   return DateTime.local().toUnixInteger()
// },

// from (timestamp) {
//   const opt = {
//     zone: store.state.settings.instance_timezone,
//     locale: app.i18n.locale || store.state.settings.instance_locale
//   }
//   return DateTime.fromSeconds(timestamp, opt).toRelative()
// },
