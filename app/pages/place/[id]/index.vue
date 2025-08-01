<script setup lang="ts">
const settings = useState<Settings>('settings')

const route = useRoute()
const { data, error } = await useFetch(`/api/events/place/${route.params.id}`)
if (!data.value) {
  throw createError({ status: 404, statusMessage: `Place ${route.params?.id} not found` })
}

useHead( () => {
      const title = `${settings.value.title} - ${data.value?.place?.name}`
      return {
        title,
        link: [
          { rel: 'alternate', type: 'application/rss+xml', title, href: settings.value.baseurl + `/feed/rss/place/${data.value?.place.name}` },
          { rel: 'alternate', type: 'text/calendar', title, href: settings.value.baseurl + `/feed/ics/place/${data.value?.place?.name}` }
        ],
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
      <div v-if='settings?.allow_geolocation && data.place?.latitude && data.place?.longitude' >
        <div class="mt-4 mx-auto px-4" >
          <!-- <Map :place='place' :height='mapHeight' /> -->
        </div>
        <div class="mt-4">
          <!-- <HowToArriveNav :place='place' class="justify-center" /> -->
        </div>
      </div>
  
      <!-- Events -->
      <section id='events' class='mt-sm-4 mt-2'>
        <EventCard v-for='(event, idx) in data?.events' :key='event.id' :event='event' :lazy='idx>9' />
        <!-- <v-lazy class='event v-card' :value='idx<9' v-for='(event, idx) in data?.events' :key='event.id' :min-height='settings.hide_thumbs ? 105 : undefined' :options="{ threshold: .5, rootMargin: '500px' }" :class="{ 'theme--dark': is_dark }"> -->
          <!-- <Event :event='event' :lazy='idx > 9' /> -->
        <!-- </v-lazy> -->
      </section>
    </v-container>
  </template>
