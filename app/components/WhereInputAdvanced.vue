<script setup lang="ts">
import type { Event } from '#build/types/nitro-imports'
import { refDebounced } from '@vueuse/core'

const event = defineModel<Event>('event', { type: Object, required: true } )

const settings = useState<Settings>('settings')
const showGeocoded = computed(() => settings.value.allow_geolocation && event?.value?.place.name !== 'online' && event?.value?.place.create)
const emit = defineEmits(['close', 'update:event'])

const search = ref(event.value.place.address)
const searchDebounced = refDebounced(search, 600)

const { data: addressList, status } = await useFetch('/api/geocode', { params: { q: searchDebounced } })

const prevAddress = ''
function selectAddress (v) {
  if (!v) { return }
  if (typeof v === 'object') {
      event.value.place.latitude = v.lat
      event.value.place.longitude = v.lon
      if (event.value.place.address === '' || event.value.place.address === prevAddress ) {
        event.value.place.address = v.address
        prevAddress = v.address
      }
  } else {
    event.value.place.latitude = event.value.place.longitude = null
  }
}
//   }
// }
</script>
<template>
<v-card>
  <v-card-title> {{ $t('event.where_advanced_options') }}</v-card-title>
  <v-card-subtitle>{{ $t('event.where_advanced_options_description') }}</v-card-subtitle>

  <v-card-text>
    <v-combobox
      v-if='showGeocoded'
      ref='geocodedAddress'
      prepend-icon='mdi-map-search'
      @update:model-value='selectAddress'
      v-model:search='search'
      :label="$t('common.search_coordinates')"
      item-title='address'
      persistent-hint hide-no-data clearable no-filter
      :loading='status === "pending"'
      :items="addressList">
        <template #message>
          <span v-html="$t('event.address_description_osm')" />
        </template>
        <template #item="{ item, props }">
          <v-list-item v-bind='props' :title='item.raw.name' :subtitle='item.raw.address' :prepend-icon='item.raw.icon' />
        </template>
    </v-combobox>

    <v-row class='mt-4'>
      <v-col class='py-0' cols=12 sm=6>
        <v-text-field
          v-model="event.place.latitude"
          prepend-icon='mdi-latitude'
          :label="$t('common.latitude')"
          :rules="$valid.latitude" />
      </v-col>
      
      <v-col class='py-0' cols=12 sm=6>
        <v-text-field
          v-model="event.place.longitude"
          prepend-icon='mdi-longitude'
          :label="$t('common.longitude')"
          :rules="$valid.longitude" />
      </v-col>
    </v-row>
    <p class='mt-4' v-if='event?.place?.create' v-html="$t('event.address_geocoded_disclaimer')" />

    <!-- //:LMapStyles="{height: mapHeight}" /> -->
    <Map
      class='mt-4'
      :place="event.place" :draggable="true" v-if="(settings.allow_geolocation && event.place.latitude && event.place.longitude)"  />
      
  </v-card-text>
  <v-card-actions>
    <v-spacer />
    <v-btn @click='emit("close")' variant='outlined' :text="$t('common.close')" />
  </v-card-actions>
</v-card>
</template>
