<script setup lang="ts">
import { refDebounced } from '@vueuse/core'
const place = defineModel<Place>('place', { type: Object, required: true })

const settings = useState<Settings>('settings')
const showGeocoded = computed(() => settings.value.allow_geolocation && place.value.name !== 'online' && place.value.create)
defineEmits(['close', 'update:event'])

const search = ref(place.value.address)
const searchDebounced = refDebounced(search, 600)

const { data: addressList, status } = useFetch('/api/geocode', { params: { q: searchDebounced } })

// let prevAddress = ''
function selectAddress (v: object) {
  if (!v) {
    return
  }
  if (typeof v === 'object') {
    place.value.latitude = v.lat
    place.value.longitude = v.lon
    // if (place.value.address === '' || place.value.address === prevAddress ) {
    place.value.address = v.address
    // prevAddress = v.address
    // }
  } else {
    place.value.latitude = place.value.longitude = undefined
  }
}

</script>
<template>
<div>
  <v-combobox
    v-if='showGeocoded'
    ref='geocodedAddress'
    v-model:search='search'
    prepend-icon='mdi-map-search'
    :model-value="search"
    :label="$t('common.search_coordinates')"
    item-title='address'
    persistent-hint
    hide-no-data clearable no-filter :loading='status === "pending"'
    :items="addressList"
    @update:model-value='selectAddress'>
    <template #message>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <span v-html="$t('event.address_description_osm')" />
    </template>
    <template #item="{ item, props }">
      <v-list-item v-bind='props' :title='item.raw.name' :subtitle='item.raw.address' :prepend-icon='item.raw.icon' />
    </template>
  </v-combobox>

  <v-row class='mt-4'>
    <v-col class='py-0' cols=12 sm=6>
      <v-text-field
        v-model="place.latitude"
        prepend-icon='mdi-latitude'
        :label="$t('common.latitude')"
        :rules="$valid.latitude" />
    </v-col>

    <v-col class='py-0' cols=12 sm=6>
      <v-text-field
        v-model="place.longitude"
        prepend-icon='mdi-longitude'
        :label="$t('common.longitude')"
        :rules="$valid.longitude" />
    </v-col>
  </v-row>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <p v-if='place?.create' class='mt-4' v-html="$t('event.address_geocoded_disclaimer')" />

  <!-- //:LMapStyles="{height: mapHeight}" /> -->
  <Map
    v-if="(settings.allow_geolocation && place.latitude && place.longitude)"
    class='mt-4' :place="place" :draggable="true"  />

</div>
</template>
