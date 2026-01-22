<!--
HOMEPAGE
The homepage shows future events by default.
-->
<script setup lang="ts">
import { DateTime } from 'luxon'
import time from '~/utils/time'

// middleware setup!

const settings = useState<Settings>('settings')
useHead({
  title: settings.value?.title,
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
    { rel: 'me', href: `${settings.value.baseurl}/federation/u/${settings.value.instance_name}` }
  ]
})

const now = time.nowUnix()

const selectedDate = useState<Date | null | undefined>('selectedDate', () => undefined)
const { events, params } = useEvents()

// check if current month is selected
const isCurrentMonth = computed(() => params.value.start === time.startMonth())

const visibleEvents = computed(() => {
  if (selectedDate.value) {
    const min = DateTime.fromJSDate(selectedDate?.value)?.startOf('day')?.toUnixInteger()
    const max = DateTime.fromJSDate(selectedDate?.value)?.endOf('day')?.toUnixInteger()
    return events.value?.filter(e => (e.start_datetime <= max && (e.end_datetime || e.start_datetime) >= min))
  } else if (isCurrentMonth.value) {
    return events.value?.filter((e) => {
      const max_datetime = Math.max(e.start_datetime, e?.end_datetime ?? 0)
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
    <v-lazy
      v-for='(event, idx) in visibleEvents' :key='event.id'
      class='event' :model-value='idx<9'
      :min-height='settings.hide_thumbs ? 105 : undefined'
      :options="{ threshold: .5, rootMargin: '500px' }">
      <EventCard :event='event' :lazy='idx>9' />
    </v-lazy>

    <div v-if="!visibleEvents?.length" class="d-flex flex-column align-center ga-2 my-8 my-sm-12">
      <span class="text-h4 text-medium-emphasis">{{ $t('common.no_events_found') }}</span>
      <span>{{ $t('common.no_events_found_hint') }}</span>
      <v-icon icon="mdi-cactus" :size="200" class="opacity-20 mt-2" />
    </div>
  </section>

</v-container>
</template>
<style>
.events {
  margin: 0 auto;
  gap: 16px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  /* display: grid;
  grid-template-columns: repeat(auto-fit,minmax(350px,1fr)); */
}

.event {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  max-width: 500px !important;
  width: 330px;
  min-height: 288px;
  position: relative;
  /* margin-top: 16px;
  margin-right: 16px; */
  transition: all .5s;
  overflow: hidden;
}

</style>
