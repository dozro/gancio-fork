<script setup>
defineProps({
  place: { type: Object, default: () => ({ latitude: 0, longitude: 0 }) },
  mapHeight: { type: String, default: '55vh' }
})

defineEmits(['close'])
</script>

<template>
<v-card>
  <v-container>
    <div :style="{'height': mapHeight}">
      <Map :place="place" :height="mapHeight" />
    </div>
    <v-row class="my-4 d-flex flex-column align-center text-center">
      <div class="text-h6">
        <v-icon>{{ mdiMapMarker }}</v-icon>
        <nuxt-link
          class="ml-2 text-decoration-none"
          :to="`/place/${place.id}/${encodeURIComponent(place.name)}`"
        >{{ place.name }}</nuxt-link>
      </div>
      <div class="mx-2">{{ place.address }}</div>
    </v-row>
  </v-container>
  <v-card-actions class="py-4">
    <HowToArriveNav class="pl-1" :place="place" />
    <v-spacer />
    <v-btn variant="outlined" @click="$emit('close')">{{ $t('common.close') }}</v-btn>
  </v-card-actions>
</v-card>
</template>
