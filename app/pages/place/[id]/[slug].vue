<script setup lang="ts">
const settings = useState<Settings>('settings')

const route = useRoute()
const { showRecurrent } = useShowRecurrent()
const { data } = await useFetch(`/api/events/place/${route.params.id}`, { query: { show_recurrent: showRecurrent } })
if (!data.value) {
  throw createError({ status: 404, statusMessage: `Place ${route.params?.id} not found` })
}

useHead(() => {
  const title = `${settings.value.title} - ${data.value?.place?.name}`
  return {
    title,
    link: [
      { rel: 'alternate', type: 'application/rss+xml', title, href: settings.value.baseurl + `/feed/rss/place/${data.value?.place.name}` },
      { rel: 'alternate', type: 'text/calendar', title, href: settings.value.baseurl + `/feed/ics/place/${data.value?.place?.name}` }
    ]
  }
})

</script>
<template>
<v-container id='home' class='px-2 px-sm-6 pt-0'>
  <h1 class='d-block text-h4 font-weight-black text-center text-uppercase mt-10 mx-auto w-100 text-underline'>
    <u>{{ data.place?.name }}</u>
  </h1>
  <span v-if='data.place?.name!=="online"' class="d-block text-subtitle text-center w-100">{{ data.place?.address }}</span>

  <!-- Map -->
  <div
    v-if='settings?.allow_geolocation && data.place?.latitude && data.place?.longitude'
    class="position-relative my-4"
  >
    <Map :place='data.place' height="12rem" />
    <HowToArriveNav :place='data.place' />
  </div>

  <!-- Events -->
  <section class='events mt-sm-4 mt-2'>
    <div
      v-for='(event, idx) of data.events'
      :key='event.id'
      class='event'
    >
      <LazyEventCard
        :hydrate-on-visible="{ rootMargin: '500px' }"
        :event='event'
        :lazy="idx>9"
        :hide-thumbs="settings.hide_thumbs"
      />
    </div>
  </section>

  <!-- Past Events -->
  <h2 v-if="data?.pastEvents.length" class='mt-14 mb-3'>{{$t('common.past_events')}}</h2>
  <section v-if="data?.pastEvents.length" class="events">
    <div
      v-for='event of data.pastEvents'
      :key='event.id'
      class='event'
    >
      <LazyEventCard
        lazy
        :hydrate-on-visible="{ rootMargin: '500px' }"
        :event='event'
        :hide-thumbs="settings.hide_thumbs"
      />
    </div>
  </section>

</v-container>
</template>
