<script setup lang='ts'>

import { DateTime } from 'luxon'
import { useTheme } from 'vuetify'

const { isAdmin } = useAuth()

const theme = useTheme()
const settings = useState<Settings>('settings')
const { t } = useI18n()
const event = defineModel<EventAPI>('event', { type: Object, required: true })

const type = ref('normal')
const frequencies = [
  { value: '1w', text: t('event.each_week') },
  { value: '2w', text: t('event.each_2w') },
  { value: '1m', text: t('event.each_month') },
  { value: '1y', text: t('event.each_year') }
]

function fromDateAndTimeToDateTime(dateObj: Date | string, timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  const dt = DateTime.fromJSDate(typeof dateObj === 'string' ? new Date(dateObj) : dateObj)
    .set({ hour: hours, minute: minutes, second: 0, millisecond: 0 }).toUnixInteger()
  return dt
}

function formatTime(date: Date | number): string {
  let dt: DateTime
  if (typeof date === 'number') {
    // If it's a unix timestamp in seconds
    dt = DateTime.fromSeconds(date)
  } else {
    dt = DateTime.fromJSDate(date)
  }
  return dt.toFormat('HH:mm')
}

// selected date is the DatePicker v-model (Date or { start : Date, end: Date} on multidate)
const selectedDate = computed({
  get() {
    if (type.value === 'multidate') {
      return event.value.start_datetime ?
          { start: DateTime.fromSeconds(event.value.start_datetime).toJSDate(),
            end: DateTime.fromSeconds(event.value?.end_datetime).toJSDate() }
        : null
    } else {
      return event.value.start_datetime ? DateTime.fromSeconds(event.value.start_datetime).toJSDate() : null
    }
  },
  set(val) {
    const sTime = startTime.value || '00:00'
    const eTime = endTime.value || '00:00'
    console.error(val)
    if (type.value === 'multidate') {
      event.value.start_datetime = fromDateAndTimeToDateTime(val.start, sTime) // DateTime.fromJSDate(val).toUnixInteger()
      event.value.end_datetime = fromDateAndTimeToDateTime(val.end, eTime) // DateTime.fromJSDate(val).toUnixInteger()
    } else {
      event.value.start_datetime = fromDateAndTimeToDateTime(val as Date, sTime) // DateTime.fromJSDate(val).toUnixInteger()
      event.value.end_datetime = fromDateAndTimeToDateTime(val as Date, eTime) // DateTime.fromJSDate(val).toUnixInteger()
    }
  }
})

// Start time
const startTime = computed({
  get() {
    return event.value.start_datetime ? formatTime(event.value.start_datetime) : ''
  },
  set(val) {
    event.value.start_datetime = fromDateAndTimeToDateTime(selectedDate.value, val) // DateTime.fromJSDate(val).toUnixInteger()
  }
})

// End time
const endTime = computed({
  get() {
    return event.value.end_datetime ? formatTime(event.value.end_datetime) : ''
  },
  set(val) {
    event.value.end_datetime = fromDateAndTimeToDateTime(selectedDate.value, val)
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
      <v-input v-model="selectedDate">
        <template #default>
          <DatePicker
            v-model='selectedDate'
            :rules="[$valid.required('common.when')]"
            class='mx-auto'
            :is-dark="theme.global.current.value.dark"
            :is-range="type === 'multidate'"
            :locale="$i18n.locale"
            is-inline
            :min-date="!isAdmin ? new Date() : undefined"
            is-expanded
          />
          <!-- :attributes="attributes" -->
          <!-- :is-dark="is_dark" -->
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
        v-model='startTime'
        :label="$t('event.from')"
        :rules="[$valid.required('event.from')]"
        prepend-icon='mdi-clock-time-four-outline'
        type='time'
        step='300' />
    </v-col>

    <v-col class="col-12 col-sm-6">
      <!-- :disabled="!value.fromHour" -->
      <v-text-field
        v-model='endTime'
        :rules="[settings.allow_event_without_end_time ? true : $valid.required('event.due')]"
        :label="$t('event.due')"
        prepend-icon='mdi-clock-time-eight-outline' type='time' />
    </v-col>

  </v-row>
  <!--
      <v-menu
        v-model="menuFromHour"
        :close-on-content-click="false"
        offset-y
        :value="event.fromHour"
        max-width="290px"
        min-width="290px"
        transition="scale-transition"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            clearable
            :clear-icon="mdiClose"
            @click:clear="() => change('fromHour')"
            :label="$t('event.from')"
            :value="$time.formatHour(value.fromHour)"
            :disabled="!value.from"
            readonly
            :prepend-icon="mdiClockTimeFourOutline"
            :rules="[$valid.required('event.from')]"
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        <v-time-picker
          v-if="menuFromHour"
          :value="value.fromHour"
          :allowedMinutes="allowedMinutes"
          full-width
          :format="$time.timeFormat()"
          @click:minute="menuFromHour = false"
          @input="hr => change('fromHour', hr)"
        ></v-time-picker>
      </v-menu>
    </v-col>

    <v-col class="col-12 col-sm-6">
      <v-menu
        v-model="menuDueHour"
        :close-on-content-click="false"
        offset-y
        max-width="290px"
        min-width="290px"
        :value="value.dueHour"
        transition="scale-transition"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-text-field
            clearable
            :clear-icon="mdiClose"
            @click:clear="() => change('dueHour')"
            :value="$time.formatHour(value.dueHour)"
            readonly
            :disabled="!value.fromHour"
            :label="$t('event.due')"
            :prepend-icon="mdiClockTimeEightOutline"
            :rules="[settings.allow_event_without_end_time ? true : $valid.required('event.due')]"
            v-bind="attrs"
            v-on="on"
          ></v-text-field>
        </template>
        <v-time-picker
          v-if="menuDueHour"
          :value="value.dueHour"
          full-width
          :allowedMinutes="allowedMinutes"
          :format="$time.timeFormat()"
          @click:minute="menuDueHour = false"
          @input="hr => change('dueHour', hr)"
        ></v-time-picker>
      </v-menu>
    </v-col>
  </v-row> -->
</v-col>

<!-- //List(v-if='type === "normal" && todayEvents.length' :events='todayEvents' :title='$t("event.same_day")') -->

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
