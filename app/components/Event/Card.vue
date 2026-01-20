<script setup lang="ts">

// import time from '~/utils/time'
const props = defineProps({
  event: { type: Object, default: () => ({}) },
  lazy: { type: Boolean, default: false },
  hideThumbs: { type: Boolean, default: false }
})

// const { time, timeToISO } = useTime()

function isPast() {
  const now = new Date()
  if (props.event.end_datetime) {
    return new Date(props.event.end_datetime * 1000) < now
  } else {
    return new Date((3 * 60 * 60 + props.event.start_datetime) * 1000) < now
  }
}
</script>

<template>
<article class='h-event event-card' itemscope itemtype="https://schema.org/Event">
  <nuxt-link :to='`/event/${event.slug || event.id}`' itemprop="url">
    <!-- <nuxt-picture/> -->
    <CoreImg v-if='!hideThumbs' :event='event' thumb :lazy='lazy' />
    <v-icon v-if='event.parentId' class='float-right mr-1' color='success' icon='mdi-repeat' />
    <v-icon v-if='isPast()' class='float-right mr-1' color='warning' icon='mdi-timer-sand' />
    <h3 class='event-title' itemprop="name">{{ event.title }}</h3>
  </nuxt-link>

  <v-img v-if='event?.ap_user?.image' cover :src='event?.ap_user?.image' max-height=30  max-width=30 style="position: absolute; top: 5px; right: 5px;" />

  <v-card-text class='pt-0 pb-0 m-0 mb-2'>
    <!-- <span>{{event.start_datetime}} - {{time.when(event)}}</span> -->

    <!-- <time class="dt-start text-subtitle-1" :datetime="time.time(event.start_datetime)" itemprop="startDate" :content="time.timeToISO(event.start_datetime)">{{time.time(event.start_datetime)}}</time> -->
    <time
      class='dt-start text-subtitle-1' :datetime='time.unixFormat(event.start_datetime, "yyyy-MM-dd HH:mm")'
      itemprop="startDate" :content="time.unixFormat(event.start_datetime, 'yyyy-MM-dd\'T\'HH:mm')"> <v-icon icon='mdi-calendar' /> {{ time.when(event) }}
    </time>
    <time
      v-if='event.end_datetime' class='d-none dt-end' itemprop="endDate"
      :content="time.unixFormat(event.end_datetime,'yyyy-MM-dd\'T\'HH:mm')"> {{ time.unixFormat(event.end_datetime)}}</time>

    <nuxt-link
      class='place d-block p-location pl-0' variant='text'
      :to='`/place/${event?.place?.id}/${encodeURIComponent(event.place.name)}`'
      itemprop="location" itemscope itemtype="https://schema.org/Place" icon='mdi-close'>
      <v-icon icon="mdi-map-marker"/>
      <span itemprop='name'>{{ event.place.name }}</span>
    </nuxt-link>
    <div class='d-none' itemprop='address'>{{ event.place.address }}</div>

  </v-card-text>

  <v-card-actions v-if='event?.tags?.length' class='flex-wrap ga-1'>
    <v-chip
      v-for='tag in event?.tags?.slice(0, 6)' :key='tag' size='small' label
      :to='`/tag/${encodeURIComponent(tag)}`' variant='outlined' color='primary'>{{ tag }}</v-chip>
  </v-card-actions>

</article>
</template>

<style>

.event-card a {
  text-decoration: none;
}

.event-card a:hover {
  text-decoration: underline;
}

.event-card .event-title {
  overflow: hidden;
  margin: 0.5rem 1rem 0.5rem 1rem;
  text-overflow: ellipsis;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  font-size: 1.1em !important;
  line-height: 1.2em !important;
}

</style>
