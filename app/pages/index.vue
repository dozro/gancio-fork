<!--
HOMEPAGE
The homepage shows future events by default.
-->
<script setup lang="ts">
import { DateTime } from 'luxon'

const settings = useState<Settings>('settings')
useHead({
  title: computed(() => settings.value?.title)
})
// console.error(settings)
// definePageMeta({
//   head: {
//     title: settings.value?.title
//   }
// })

import time from '~/utils/time'
const now = time.nowUnix()

const params = useState('params')
const selectedDate = useState<Date|null|undefined>('selectedDate', () => undefined)
const attributes = useState('attributes')
const isCurrentMonth = computed(() => {
  return false
})


const { data: events, status } = await useFetch<Event[]>('/api/events', { params,
  onResponse: res => {
    attributes.value = useAttributesFromEvents(res.response._data)
  }
})


const visibleEvents = computed(() => {
  if (selectedDate.value) {
    const min = DateTime.fromJSDate(selectedDate?.value)?.startOf('day')?.toUnixInteger()
    const max = DateTime.fromJSDate(selectedDate?.value)?.endOf('day')?.toUnixInteger()
    return events.value?.filter(e => (e.start_datetime <= max && (e.end_datetime || (e.start_datetime + 1)) > min))
  } else if (isCurrentMonth.value) { // && !query) {
    return events.value?.filter(e => {
      const max_datetime = Math.max(e.start_datetime, e.end_datetime)
      return (e.end_datetime ? max_datetime >= now : e.start_datetime + 3 * 60 * 60 >= now)
    })
  } else {
    return events.value //?.filter(e => showRecurrent || !e.parentId)
  }
})


const { data: announcements } = await useFetch<Announcement[]>('/api/announcements')

// const { data } = await useFetch<Event[]>('/api/events')
// events.value = data.value || []
</script>
<template>
  <v-container id='home' class='px-2 px-sm-6 pt-0'>
    <span>params: {{params}} - events: {{ events?.length }} - {{ status }}</span>
    <!-- Announcements -->
    <section v-if='announcements?.length' id='announcements' class='mt-2 mt-sm-4'>
      <Announcement v-for='announcement in announcements' :key='announcement.id' :announcement='announcement' />
    </section>
    
    <!-- Events -->
    <section id='events' class='mt-sm-4 mt-2'>
      <EventCard v-for='(event, idx) in visibleEvents' :key='event.id' :event='event' :lazy='idx>9' />
      <!-- <v-lazy class='event v-card' 
        v-for='(event, idx) in events' :key='event.id'
        :options="{ threshold: .5, rootMargin: '500px' }">
      </v-lazy> -->
    </section>
    <!-- <section class='text-center' v-else> -->
      <!-- <v-progress-circular class='mt-5 justify-center align-center mx-auto' color='primary' indeterminate model-value='20' /> -->
    <!-- </section> -->
    
  </v-container>
</template>
<style>
#events {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(350px,1fr));
  gap: 10px;
}
</style>
<!-- <script setup lang="ts"> -->
// import { mapState, mapActions, mapGetters  } from 'vuex'
// import { DateTime } from 'luxon'
// import Event from '@/components/Event'
// import Announcement from '@/components/Announcement'
// import ThemeView from '@/components/ThemeView'
// import { mdiMagnify, mdiCloseCircle } from '@mdi/js'

// export default {
//   name: 'Index',
//   components: { Event, Announcement, ThemeView },
//   middleware: 'setup',
//   fetch () {
//     if (process.server) return
//     if (this.filter.query) {
//       return this.getEvents({
//         query: this.filter.query,
//         older: true
//       })
//     } else {
//       return this.getEvents({
//         start: this.start,
//         end: this.end,
//       })
//     }
//   },
//   data ({ $time }) {
//     return {
//       mdiMagnify, mdiCloseCircle,
//       isCurrentMonth: true,
//       now: $time.nowUnix(),
//       start: $time.startMonth(),
//       end: null,
//       tmpEvents: [],
//       selectedDay: null,
//       storeUnsubscribe: null,
//     }
//   },
//   head () {
//     return {
//       title: this.settings.title,
//       meta: [
//       // hid is used as unique identifier. Do not use `vmid` for it as it will not work
//       { hid: 'description', name: 'description', content: this.settings?.description },
//       { hid: 'og-description', name: 'og:description', content: this.settings?.description },
//       { hid: 'og-title', property: 'og:title', content: this.settings.title },
//       { hid: 'og-url', property: 'og:url', content: this.settings.baseurl },
//       { property: 'og:image', content: this.settings.baseurl + '/logo.png' }
//       ],
//       link: [
//       { rel: 'apple-touch-icon', href: this.settings.baseurl + '/logo.png' },
//       { rel: 'alternate', type: 'application/rss+xml', title: this.settings.title, href: this.settings.baseurl + '/feed/rss' },
//       { rel: 'alternate', type: 'text/calendar', title: this.settings.title, href: this.settings.baseurl + '/feed/ics' },
//       { rel: 'me', href: `${this.settings.baseurl}/federation/u/${this.settings.instance_name}`}
//       ]
//     }
//   },
//   computed: {
//     ...mapState(['settings', 'announcements', 'events', 'filter']),
//     ...mapGetters(['hide_thumbs', 'is_dark']),
//     visibleEvents () {
//       const now = this.$time.nowUnix()
//       if (this.selectedDay) {
//         const min = this.selectedDay.startOf('day').toUnixInteger()
//         const max = this.selectedDay.endOf('day').toUnixInteger()
//         return this.events.filter(e => (e.start_datetime <= max && (e.end_datetime || (e.start_datetime + 1)) > min) && (this.filter.show_recurrent || !e.parentId))
//       } else if (this.isCurrentMonth && !this.filter.query) {
//         return this.events.filter(e => {
//           const max_datetime = Math.max(e.start_datetime, e.end_datetime)
//           return (e.end_datetime ? max_datetime >= now : e.start_datetime + 3 * 60 * 60 >= now) && (this.filter.show_recurrent || !e.parentId)
//         })
//       } else {
//         return this.events.filter(e => this.filter.show_recurrent || !e.parentId)
//       }
//     }
//   },
//   created () {
//     this.$root.$on('dayclick', this.dayChange)
//     this.$root.$on('monthchange', this.monthChange)
//     if (process.client) {
//       this.storeUnsubscribe = this.$store.subscribeAction( { after: (action, state) => {
//         if (action.type === 'setFilter') { this.$fetch() }
//       }})
//     }
//   },
//   destroyed () {
//     this.$root.$off('dayclick')
//     this.$root.$off('monthchange')
//     if (typeof this.storeUnsubscribe === 'function') {
//       this.storeUnsubscribe()
//     }
//   },
//   methods: {
//     ...mapActions(['getEvents']),
//     async monthChange ({ year, month }) {
//       if (this.filter.query) return
//       this.$nuxt.$loading.start()
//       let isCurrentMonth
      
//       // unselect current selected day
//       this.selectedDay = null
//       const now = DateTime.local({zone: this.settings.instance_timezone})
//       // check if current month is selected
//       if (month === now.month && year === now.year) {
//         isCurrentMonth = true
//         this.start = now.startOf('month').toUnixInteger()
//         this.end = null
//       } else {
//         isCurrentMonth = false
//         this.start = DateTime.local(year, month, { zone: this.settings.instance_timezone }).toUnixInteger()
//         this.end = DateTime.local(year, month, { zone: this.settings.instance_timezone }).plus({ month: !this.$vuetify.breakpoint.smAndDown ? 1 : 0 }).endOf('month').toUnixInteger() // .endOf('week').unix()
//       }
//       await this.$fetch()
//       this.$nuxt.$loading.finish()
//       this.$nextTick( () => this.isCurrentMonth = isCurrentMonth)
      
//     },
//     dayChange (day) {
//       if (!day) {
//         this.selectedDay = null
//         return
//       }
//       const date = DateTime.fromJSDate(day)
//       this.selectedDay = day ? DateTime.local({ zone: this.settings.instance_timezone }).set({ year: date.year, month: date.month, day: date.day}) : null
//     }
//   }
// }
