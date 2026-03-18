<script setup lang='ts'>

import { DateTime } from 'luxon'

const { isAdmin } = useAuth()
const { attributes, events } = useEvents()
const { theme } = useAppTheme()
const settings = useState<Settings>('settings')
const { t } = useI18n()
const event = defineModel<EventAPI>('event', { type: Object, required: true })

const frequencies = [
  { value: '1w', text: t('event.each_week') },
  { value: '2w', text: t('event.each_2w') },
  { value: '1m', text: t('event.each_month') },
  { value: '1y', text: t('event.each_year') }
]

function fromDateAndTimeToDateTime(dateObj: Date, timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return DateTime.fromJSDate(dateObj)
    .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 }).toUnixInteger()
}

function formatTime(date: number): string {
  return DateTime.fromSeconds(date).toFormat('HH:mm')
}

const isMultiDate = (start: number, end?: number) => end && !DateTime.fromSeconds(end).hasSame(DateTime.fromSeconds(start), 'day')
const eventIsMultidate = computed(() => isMultiDate(event.value.start_datetime, event.value.end_datetime))

const type = ref(eventIsMultidate.value ? 'multidate' : 'normal')
const selectedDates = ref<Date | { start: Date, end: Date } | null>(
  eventIsMultidate.value
    ? {
        start: new Date(event.value.start_datetime * 1000),
        end: new Date((event.value.end_datetime as number) * 1000)
      }
    : (event.value.start_datetime ? new Date(event.value.start_datetime * 1000) : null)
)
const selectedStartTime = ref<string | null>(event.value.start_datetime ? formatTime(event.value.start_datetime) : null)
const selectedEndTime = ref<string | null>(event.value.end_datetime ? formatTime(event.value.end_datetime) : null)

const todayEvents = computed(() => {
  if (!events.value ||
    (type.value === 'normal' && !selectedDates.value) ||
    (type.value == 'multidate' && !selectedDates?.value?.start)) {
    console.error('no selected date')
    return []
  }
  const startOfDay = selectedDates.value instanceof Date
    ? DateTime.fromJSDate(selectedDates.value).startOf('day').toSeconds()
    : DateTime.fromJSDate(selectedDates?.value?.start).startOf('day').toSeconds()
  const endOfDay = selectedDates.value instanceof Date
    ? DateTime.fromJSDate(selectedDates.value).endOf('day').toSeconds()
    : DateTime.fromJSDate(selectedDates?.value?.end).endOf('day').toSeconds()

  return events?.value?.filter(e => e.id !== event.value.id && e.start_datetime >= startOfDay && e.start_datetime <= endOfDay)
})


watch([selectedDates, selectedStartTime, selectedEndTime], ([dates, startTime, endTime]) => {
  if (!startTime || !dates) {
    event.value.start_datetime = 0
    event.value.end_datetime = undefined
  } else if (dates instanceof Date) { // Single date
    event.value.start_datetime = fromDateAndTimeToDateTime(dates, startTime)
    event.value.end_datetime = endTime
      ? fromDateAndTimeToDateTime(dates, endTime)
      : undefined
  } else if (endTime) { // multidate
    event.value.start_datetime = fromDateAndTimeToDateTime(dates.start, startTime)
    event.value.end_datetime = fromDateAndTimeToDateTime(dates.end, endTime)
  }
})

</script>
<template>
<v-col cols="12">
  <div class="text-center">
    <v-btn-toggle
      v-if="!event.parentId && !event.recurrent"
      v-model="type"
      class="flex-wrap flex-row"
      variant='outlined'
      color="primary"
      mandatory
    >
      <v-btn value="normal" label="normal">{{ $t('event.normal') }}</v-btn>
      <v-btn v-if="settings.allow_multidate_event" value="multidate" label="multidate">{{ $t('event.multidate') }}</v-btn>
      <v-btn v-if="settings.allow_recurrent_event" value="recurrent" label="recurrent">{{ $t('event.recurrent') }}</v-btn>
    </v-btn-toggle>

    <p>{{ $t(`event.${type}_description`) }}</p>

    <v-btn-toggle
      v-if="type === 'recurrent'"
      class="v-col-6 flex-column flex-sm-row"
      color="primary"
      :model-value="event.recurrent.frequency"
    >
      <!-- @change="fq => change('frequency', fq)" -->
      <v-btn v-for="f in frequencies" :key="f.value" :value="f.value">{{ f.text }}</v-btn>
    </v-btn-toggle>

    <div class="mx-auto d-block mt-3">
      <v-input v-model="selectedDates" :rules="[$valid.required('common.when')]">
        <template #default>
          <DatePicker
            v-model='selectedDates'
            :rules="[$valid.required('common.when')]"
            class='mx-auto'
            :is-dark="theme.current?.value?.dark"
            :is-range="type === 'multidate'"
            :locale="$i18n.locale"
            :attributes="attributes" 
            is-inline
            :min-date="!isAdmin ? new Date() : undefined"
            is-expanded
          />
        </template>
      </v-input>
    </div>

  </div>

  <div v-if="type === 'recurrent'" class="text-center mb-2">
    <span v-if="event.recurrent.frequency !== '1m' && event.recurrent.frequency !== '2m'">{{ whenPatterns }}</span>
    <v-btn-toggle
      v-else
      class="mt-1 flex-column flex-sm-row"
      :model-value="event.recurrent.type"
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
        v-model='selectedStartTime'
        :label="$t('event.from')"
        :rules="[$valid.required('event.from')]"
        prepend-icon='mdi-clock-time-four-outline'
        type='time'
        step='300' />
    </v-col>

    <v-col class="col-12 col-sm-6">
      <!-- :disabled="!value.fromHour" -->
      <v-text-field
        v-model='selectedEndTime'
        :rules="[settings.allow_event_without_end_time && type !== 'multidate' ? true : $valid.required('event.due')]"
        :label="$t('event.due')"
        prepend-icon='mdi-clock-time-eight-outline' type='time' />
    </v-col>

  </v-row>

</v-col>

<CoreEventList v-if='todayEvents.length' :events='todayEvents' :title='$t("event.same_day")' />

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
//     whenPatterns() {
//       if (!this.value.from) { return }
//       const date = DateTime.fromJSDate(this.value.from)

//       const freq = this.value.recurrent.frequency
//       const weekDay = date.toFormat('EEEE')
//       if (freq === '1w' || freq === '2w') {
//         return this.$t(`event.recurrent_${freq}_days`, { days: weekDay }).toUpperCase()
//       } else if (freq === '1m' || freq === '2m') {
//         const n = Math.floor((date.day-1) / 7) + 1

//         const patterns = [
//           { label: this.$t(`event.recurrent_${freq}_days`, { days: date.day }), key: 'ordinal' }
//           // { label: this.$tc(`event.recurrent_${freq}_ordinal`, { n, days: weekDay }), key: 'weekday' }
//         ]

//         if (n < 5) {
//           patterns.push(
//             {
//               label: this.$t(`event.recurrent_${freq}_ordinal`, { n: this.$t(`ordinal.${n}`), days: weekDay }),
//               key: n
//             }
//           )
//         }

//         // if selected day is in last week, propose also this type of selection
//         const lastWeek = date.endOf('month').day - date.day < 7
//         if (lastWeek) {
//           patterns.push(
//             {
//               label: this.$t(`event.recurrent_${freq}_ordinal`, { n: this.$t('ordinal.-1'), days: weekDay }),
//               key: -1
//             }
//           )
//         }

//         return patterns
//       } else if (freq === '1d') {
//         return this.$t('event.recurrent_each_day')
//       }
//       return ''
//     }
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
