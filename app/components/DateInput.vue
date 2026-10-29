<script setup lang='ts'>

import type { WatchIgnorableReturn } from '@vueuse/core'

import { DateTime } from 'luxon'
import { watchIgnorable } from '@vueuse/core'
import type { Recurrent } from '~~/server/services/db'

const time = useTime()
const { isAdmin } = useAuth()
const { attributes, events } = useEvents()
const { theme } = useAppTheme()
const settings = useState<Settings>('settings')
const { locale, t } = useI18n()

const event = defineModel<EventAPI>('event', { type: Object, required: true })

const tz = settings.value.instance_timezone
const dtOpts = computed(() => ({
  zone: tz,
  locale: locale.value || settings.value.instance_locale,
}))

const today = DateTime.now().setZone(tz).startOf('day')
const initialCalendarPage = useInitialCalendarPage()
const frequencies = computed(() => [
  { value: '1w', text: t('event.each_week') },
  { value: '2w', text: t('event.each_2w') },
  { value: '1m', text: t('event.each_month') },
  { value: '1y', text: t('event.each_year') }
])

// Component state
interface ComponentState {
  type: 'normal' | 'multidate' | 'recurrent'
  // If editing an existing instance of a recurring event, the type cannot be
  // changed.
  frozenType: boolean
  recurrentFreq?: Recurrent['frequency']
  recurrentType?: Recurrent['type']
  startDate: number | null
  endDate: number | null
  startTime: string | null
  endTime: string | null
}
const state = ref<ComponentState>({
  type: 'normal',
  frozenType: false,
  recurrentFreq: undefined,
  recurrentType: undefined,
  startDate: null,
  endDate: null,
  startTime: null,
  endTime: null
})

// The watchIgnorable avoids an infinite loop between watchers.
const stateWatcher: WatchIgnorableReturn = watchIgnorable(
  () => Object.values(state.value),
  () => modelWatcher.ignoreUpdates(resetModel),
  { deep: true, flush: 'post' }
)

const modelWatcher: WatchIgnorableReturn = watchIgnorable(
  event,
  () => stateWatcher.ignoreUpdates(resetState),
  { flush: 'post', immediate: true },
)

// Reset the internal state to match the model.
function resetState() {
  const ev = event.value
  const st = state.value
  const evType = ev.recurrent ?
    'recurrent' :
    time.isMultiDate(ev.start_datetime, ev.end_datetime) ?
      'multidate' :
      'normal'

  st.type = evType
  st.frozenType = !!ev.parentId
  if (evType == 'recurrent') {
    st.recurrentFreq = ev?.recurrent?.frequency
    st.recurrentType = ev?.recurrent?.type
  }
  // DatePicker will ignore the seconds after midnight
  if (ev.start_datetime) {
    st.startDate = ev.start_datetime * 1000
    st.startTime = DateTime.fromSeconds(ev.start_datetime, dtOpts.value)
      .toFormat('HH:mm')
  } else {
    st.startDate = st.startTime = null
  }
  if (ev.end_datetime) {
    st.endDate = ev.end_datetime * 1000
    st.endTime = DateTime.fromSeconds(ev.end_datetime, dtOpts.value)
      .toFormat('HH:mm')
  } else {
    st.endDate = st.endTime = null
  }
}

// Reset the model to match the internal state.
function resetModel() {
  const ev = event.value
  const st = state.value
  const evType = st.type
  if (evType == 'recurrent') {
    ev.recurrent = { frequency: st.recurrentFreq!, type: st.recurrentType! }
  }
  const startDate = st.startDate
  const startTime = st.startTime
  if (startDate && startTime) {
    const startDateDT = DateTime.fromMillis(startDate, dtOpts.value)
    const startTimeDT = DateTime.fromISO(startTime, dtOpts.value)
    ev.start_datetime = startDateDT.set({
      hour: startTimeDT.hour,
      minute: startTimeDT.minute,
      second: 0,
    }).toUnixInteger()
  } else {
    ev.start_datetime = null
  }
  const endDate = st.endDate
  const endTime = st.endTime
  if (endDate && endTime) {
    const endDateDT = DateTime.fromMillis(endDate, dtOpts.value)
    const endTimeDT = DateTime.fromISO(endTime, dtOpts.value)
    ev.end_datetime = endDateDT.set({
      hour: endTimeDT.hour,
      minute: endTimeDT.minute,
      second: 0,
    }).toUnixInteger()
  } else {
    ev.end_datetime = null
  }
}
const todayEvents = computed(() => {
  const startDate = state.value.startDate
  const endDate = state.value.endDate
  if (!events.value || !startDate) {
    return []
  }
  const startOfDay = DateTime.fromMillis(startDate, dtOpts.value)
    .startOf('day').toSeconds()
  const endOfDay = DateTime.fromMillis(endDate ?? startDate, dtOpts.value)
    .endOf('day').toSeconds()

  return events?.value?.filter(
    (e) => e.id !== event.value.id &&
      e.start_datetime >= startOfDay && e.start_datetime <= endOfDay)
})

const whenPatterns = computed(() => {
  if (state.value.type != 'recurrent' || !state.value.startDate) {
    return []
  }
  const date = DateTime.fromMillis(state.value.startDate, dtOpts.value)
  const freq = state.value.recurrentFreq
  const weekDay = date.toFormat('EEEE', dtOpts.value)
  if (freq === '1w' || freq === '2w') {
    return t(`event.recurrent_${freq}_days`, { days: weekDay }).toUpperCase()
  } else if (freq === '1m' || freq === '2m') {
    const n = Math.floor((date.day - 1) / 7) + 1

    const patterns: { label: string, key: 'ordinal' | number }[] = [
      { label: t(`event.recurrent_${freq}_days`, { days: date.day }), key: 'ordinal' }
    ]

    if (n < 5) {
      patterns.push({
        label: t(`event.recurrent_${freq}_ordinal`, { n: t(`ordinal.${n}`), days: weekDay }),
        key: n
      })
    }

    // if selected day is in last week, propose also this type of selection
    const lastWeek = date.endOf('month').day - date.day < 7
    if (lastWeek) {
      patterns.push({
        label: t(`event.recurrent_${freq}_ordinal`, { n: t('ordinal.-1'), days: weekDay }),
        key: -1
      })
    }

    return patterns
  // } else if (freq === '1d') {
  //   return t('event.recurrent_each_day')
  }
  return []
})

// normalize DatePicker input
const pickDates = computed({
  get: () => {
    return state.value.type !== 'multidate' ?
      state.value.startDate :
        { start: state.value.startDate, end: state.value.endDate }
  },
  set: (dates: number | { start: number, end: number | null } | null) => {
    if (typeof dates === 'number' || !dates) {
      state.value.startDate = dates
      state.value.endDate = dates
    } else {
      state.value.startDate = dates.start
      state.value.endDate = dates.end
    }
  },
})
</script>

<template>
<v-col cols="12">
  <div class="text-center">
    <v-btn-toggle
      v-model="state.type"
      :disabled="state.frozenType"
      class="flex-wrap flex-row"
      variant='outlined'
      color="primary"
      mandatory
    >
      <v-btn value="normal" label="normal">{{ t('event.normal') }}</v-btn>
      <v-btn v-if="settings.allow_multidate_event" value="multidate" label="multidate">{{ t('event.multidate') }}</v-btn>
      <v-btn v-if="settings.allow_recurrent_event" value="recurrent" label="recurrent">{{ t('event.recurrent') }}</v-btn>
    </v-btn-toggle>

    <p>{{ t(`event.${state.type}_description`) }}</p>
    <v-btn-toggle
      v-if="state.type === 'recurrent'"
      v-model="state.recurrentFreq"
      class="flex-wrap flex-row"
      variant='outlined'
      mandatory
      color="primary"
    >
      <v-btn v-for="f in frequencies" :key="f.value" :value="f.value">{{ f.text }}</v-btn>
    </v-btn-toggle>

    <div class="mx-auto d-block mt-3">
      <v-input
        :model-value="pickDates"
        :rules="[$valid.required('common.date')]">
        <DatePicker
          v-model.number="pickDates"
          :timezone="tz"
          class="mx-auto"
          :is-dark="theme.current?.value?.dark"
          :is-range="state.type === 'multidate'"
          :locale="$i18n.locale"
          :attributes="attributes"
          is-inline
          :min-date="!isAdmin ? today.toMillis() : undefined"
          :initial-page="pickDates ? undefined : initialCalendarPage"
          is-expanded
        />
      </v-input>
    </div>

  </div>

  <div v-if="state.type === 'recurrent'" class="text-center mb-2">
    <span v-if="typeof whenPatterns === 'string'">{{ whenPatterns }}</span>
    <v-btn-toggle
      v-else
      v-model="state.recurrentType"
      variant="outlined"
      color="primary"
      mandatory
      class="mt-1 flex-column flex-sm-row"
    >
      <v-btn
        v-for="whenPattern in whenPatterns"
        :key="whenPattern.key"
        :value="whenPattern.key"
        size='small'
      >{{ whenPattern.label }}</v-btn>
    </v-btn-toggle>
  </div>

  <v-row class="mt-3 col-md-6 mx-auto datePicker">

    <v-col class="col-12 col-sm-6">
      <v-text-field
        v-model='state.startTime'
        :label="t('event.from')"
        :rules="[$valid.required('event.from')]"
        prepend-icon='mdi-clock-time-four-outline'
        type='time'
        step='300' />
    </v-col>

    <v-col class="col-12 col-sm-6">
      <!-- :disabled="!value.fromHour" -->
      <v-text-field
        v-model='state.endTime'
        :rules="[settings.allow_event_without_end_time && state.type !== 'multidate' ? true : $valid.required('event.due')]"
        :label="t('event.due')"
        prepend-icon='mdi-clock-time-eight-outline' type='time' />
    </v-col>

  </v-row>

</v-col>

<CoreEventList v-if='todayEvents.length' :events='todayEvents' :title='t("event.same_day")' />

<!-- // import { DateTime } from 'luxon'
// import { mapState, mapActions, mapGetters } from 'vuex'
// import List from '@/components/List'
// import { mdiClockTimeFourOutline, mdiClockTimeEightOutline, mdiClose } from '@mdi/js'

// export default {
//   name: 'DateInput',
//   components: { List },
//   props: {
//     value: { type: Object, default: () => ({ from: null, due: null, recurrent: null, fromHour: null, dueHour: null }) },
//     event: { type: Object, default: () => null }
//   },
//   data() {
//     return {
//       mdiClockTimeFourOutline, mdiClockTimeEightOutline, mdiClose,
//       allowedMinutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
//       menuFromHour: false,
//       menuDueHour: false,
//       type: this.value.type || 'normal',
//       frequencies: [
//         { value: '1w', text: this.$t('event.each_week') },
//         { value: '2w', text: this.$t('event.each_2w') },
//         { value: '1m', text: this.$t('event.each_month') }
//       ]
//     }
//   },
//   computed: {
//     ...mapState(['settings', 'events']),
//     ...mapGetters(['is_dark']),
//     fromDate () {
//       if (this.value.from) {
//         if (this.value.multidate) {
//           return ({ start: new Date(this.value.from), end: new Date(this.value.due) })
//         } else {
//           return new Date(this.value.from)
//         }
//       }
//     },
//     todayEvents() {
//       const start = this.$time.startOfDay(this.value.from)
//       const end = this.$time.endOfDay(this.value.from)
//       return this.events.filter(e => e.id !== this.event.id && e.start_datetime >= start && e.start_datetime <= end)
//     },
//     attributes() {
//       return this.$time.attributesFromEvents(this.events.filter(e => e.id !== this.event.id))
//     },
//   },
//   async mounted() {
//     if (this.value.multidate) {
//       this.type = 'multidate'
//     } else if (this.value.recurrent) {
//       this.type = 'recurrent'
//     } else {
//       this.type = 'normal'
//     }
//     if (!this.events) {
//       this.getEvents()
//     }
//   },
 //   methods: {
//     ...mapActions(['getEvents']),
//     updateRecurrent(value) {
//       this.$emit('input', { ...this.value, recurrent: value || null })
//     },
//     change(what, value) {
//       // change event's type
//       if (what === 'type') {
//         if (typeof value === 'undefined') { this.type = 'normal' }
//         if (value === 'recurrent') {
//           this.$emit('input', { ...this.value, due: null, recurrent: { frequency: '1w' }, multidate: false })
//         } else if (value === 'multidate') {
//           this.$emit('input', { ...this.value, recurrent: null, multidate: true })
//         } else {
//           let from = this.value.from
//           if (from && from.start) {
//             from = from.start
//           }
//           let due = this.value.multidate ? null : this.value.due
//           if (due && due.start) {
//             due = due.start
//           }
//           this.$emit('input', { ...this.value, from, due, recurrent: null, multidate: false })
//         }
//       } else if (what === 'frequency') {
//         if (typeof value === 'undefined') { value = '1w' }
//         this.$emit('input', { ...this.value, recurrent: { ...this.value.recurrent, frequency: value } })
//       } else if (what === 'recurrentType') {
//         this.$emit('input', { ...this.value, recurrent: { ...this.value.recurrent, type: value } })
//       } else if (what === 'fromHour') {
//         if (value) {
//           this.$emit('input', { ...this.value, fromHour: value })
//         } else {
//           this.$emit('input', { ...this.value, fromHour: null, dueHour: null })
//         }
//       } else if (what === 'dueHour') {
//         if (value) {
//           this.value.due = this.value.due ? this.value.due : this.value.from
//           const [hour, minute] = value.split(':')
//           const [fromHour, fromMinute] = this.value.fromHour.split(':')
//           if (!this.value.multidate) {
//             if (hour < fromHour) {
//               this.value.due = DateTime.fromJSDate(this.value.from, {zone: this.settings.instance_timezone}).plus({day: 1}).toJSDate()
//             } else {
//               this.value.due = DateTime.fromJSDate(this.value.from, {zone: this.settings.instance_timezone}).toJSDate()
//             }
//           } else {
//             this.value.due = DateTime.fromJSDate(this.value.due, {zone: this.settings.instance_timezone}).set({ hour, minute }).toJSDate()
//           }
//         } else {
//           if (!this.value.multidate) {
//             this.value.due = null
//           } else {
//             this.value.due = DateTime.fromJSDate(this.value.due, {zone: this.settings.instance_timezone}).set({ hour: 23, minute:59 }).toJSDate()
//           }
//         }
//         this.$emit('input', { ...this.value, dueHour: value })

//         // change date in calendar (could be a range or a recurrent event...)
//       } else if (what === 'date') {
//         if (value === null) {
//           this.$emit('input', { ...this.value, from: null, due: null, fromHour: null, dueHour: null })
//           return
//         }
//         if (this.value.multidate) {
//           let from = value.start
//           let due = value.end
//           this.$emit('input', { ...this.value, from, due })
//         } else {
//           let from = value
//           let due = this.value.due
//           // recalculated end date
//           if (this.value.from) {
//             let newDueDate = new Date(value).toDateString()
//             if (this.value.dueHour < this.value.fromHour) {
//               newDueDate = new Date(DateTime.fromJSDate(from, {zone: this.settings.instance_timezone}).plus({day: 1}).toJSDate()).toDateString()
//             }
//             due = new Date(newDueDate + " " + this.value.dueHour)
//           }
//           this.$emit('input', { ...this.value, from, due })
//         }
//       }
//     },
//   }
// } -->
</template>

<style>
.datePicker {
  max-width: 500px !important;
  margin: 0 auto;
}

/* in chrome the input type time adds an icon by default, remove it to make it the same for each browser */
input[type="time"]::-webkit-calendar-picker-indicator {
  display: none;
  -webkit-appearance: none;
}
</style>
