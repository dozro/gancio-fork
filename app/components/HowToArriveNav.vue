<script setup lang="ts">

const props = defineProps({
  place: { type: Object, default: () => ({ latitude: 0, longitude: 0 }) }
})

function routeBy (type: 'foot' | 'bike' | 'car' | 'transit') {
  const lat = props.place.latitude
  const lon = props.place.longitude
  const routingType = {
    foot: 'engine=fossgis_osrm_foot',
    bike: 'engine=fossgis_osrm_bike',
    car: 'engine=fossgis_osrm_car',
    transit: null
  }
  return `https://www.openstreetmap.org/directions?from=&to=${lat},${lon}&${routingType[type]}#map=14/${lat}/${lon}`
}
</script>

<template>
<v-row color="primary">
  <!-- <p class="my-4">{{ $t('common.getting_there') }}</p> -->
  <v-btn class="mx-1" icon='mdi-walk' size="large" :href="routeBy('foot')" />
  <v-btn class="mx-1" icon='mdi-bike' size="large" :href="routeBy('bike')" />
  <v-btn class="mx-1" icon='mdi-car' size="large" :href="routeBy('car')" />
</v-row>
</template>
