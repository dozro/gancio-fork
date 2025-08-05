<!--
HOMEPAGE
The homepage shows future events by default.
-->
<script setup lang="ts">
import type { Event } from '#build/types/nitro-imports'
import { DateTime } from 'luxon'

// middleware setup!

const settings = useState<Settings>('settings')
useHead({
  title: computed(() => settings.value?.title),
  meta: [
    { name: 'description', content: settings?.value.description },
    { name: 'og:description', content: settings?.value.description },
    { property: 'og:title', content: settings.value.title },
    { property: 'og:url', content: settings.value.baseurl },
    { property: 'og:image', content: settings.value.baseurl + '/logo.png' }
  ],
  link: [
    { rel: 'apple-touch-icon', href: settings.value.baseurl + '/logo.png' },
    { rel: 'alternate', type: 'application/rss+xml', title: settings.value.title, href: settings.value.baseurl + '/feed/rss' },
    { rel: 'alternate', type: 'text/calendar', title: settings.value.title, href: settings.value.baseurl + '/feed/ics' },
    { rel: 'me', href: `${settings.value.baseurl}/federation/u/${settings.value.instance_name}`}
  ]
})

import time from '~/utils/time'
const now = time.nowUnix()

const params = useState('params')
const selectedDate = useState<Date|null|undefined>('selectedDate', () => undefined)
const attributes = useState('attributes')
const isCurrentMonth = computed(() => {
  return false
})


const { data: events } = await useFetch<Event[]>('/api/events', { params,
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
    return events.value
  }
})


const { data: announcements } = await useFetch<Announcement[]>('/api/announcements')

</script>
<template>
  <v-container id='home' class='px-2 px-sm-6 pt-0'>

    <!-- Announcements -->
    <section v-if='announcements?.length' id='announcements' class='mt-2 mt-sm-4'>
      <Announcement v-for='announcement in announcements' :key='announcement.id' :announcement='announcement' />
    </section>
    
    <!-- Events -->
    <section class='events mt-sm-4 mt-2'>
      <v-lazy class='event' :modelValue='idx<9'
        v-for='(event, idx) in visibleEvents' :key='event.id'
        :min-height='settings.hide_thumbs ? 105 : undefined'
        :options="{ threshold: .5, rootMargin: '500px' }">
        <!-- :class="{ 'theme--dark': is_dark }"> -->
      <EventCard :event='event' :lazy='idx>9' />
      </v-lazy>
    </section>
    <!-- <section class='text-center' v-else> -->
      <!-- <v-progress-circular class='mt-5 justify-center align-center mx-auto' color='primary' indeterminate model-value='20' /> -->
    <!-- </section> -->
    
  </v-container>
</template>
<style>
.events {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(350px,1fr));
  gap: 10px;
}
</style>
