<script setup lang="ts">

const settings = useState<Settings>('settings')


const route = useRoute()
const tagName = route.params.tag
const { data: events } = await useFetch<Tag>(`/api/events/tag/${tagName}`)
  if (!events.value) {
    throw createError({ status: 404, statusMessage: 'Tag not found'})
}

useHead( () => {
  const title = `${settings.value.title} - ${tagName}`
  return {
    title,
    link: [
      { rel: 'alternate', type: 'application/rss+xml', title, href: settings.value.baseurl + `/feed/rss/tag/${tagName}` },
      { rel: 'alternate', type: 'text/calendar', title, href: settings.value.baseurl + `/feed/ics/tag/${tagName}` }
    ],
  }
})

</script>
<template>
    <v-container id='home' class='px-2 px-sm-6 pt-0'>
      <h1 class='d-block text-h4 font-weight-black text-center text-uppercase mt-10 mx-auto w-100 text-underline'>
        <u>{{ tagName }}</u>
      </h1>

      <!-- Events -->
      <section class='events mt-sm-4 mt-2'>
      <v-lazy class='event' :modelValue='idx<9'
        v-for='(event, idx) in events' :key='event.id'
        :min-height='settings.hide_thumbs ? 105 : undefined'
        :options="{ threshold: .5, rootMargin: '500px' }">
        <!-- :class="{ 'theme--dark': is_dark }"> -->
        <EventCard :event='event' :lazy='idx>9' />
      </v-lazy>
      </section>
    </v-container>
  </template>