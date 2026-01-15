<script setup lang="ts">

const settings = useState<Settings>('settings')
const { $notify, $confirm }  = useNuxtApp()

// import { isoCountries } from '../../server/helpers/geolocation/isoCountries'
// import geolocation from '../../server/helpers/geolocation/index'

      // mapKey: 0,
      // mapPreview: false,
      // mapCenter: [42, 42],
      // isNewTilelayerTest: false,
      // isNewGeocodingTest: false,
      // geocoding_provider_type_items: ['Nominatim', 'Photon'],
      // geocoding_provider_type: $store.state.settings.geocoding_provider_type || '',
      // geocoding_provider_type_default: 'Nominatim',
      // geocoding_provider: $store.state.settings.geocoding_provider || '',
      // geocoding_provider_default: "https://nominatim.openstreetmap.org/search" ,
      // geocoding_countrycodes: $store.state.settings.geocoding_countrycodes || [],
      // tilelayer_provider: $store.state.settings.tilelayer_provider || '',
      // tilelayer_provider_default: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      // tilelayer_provider_attribution: $store.state.settings.tilelayer_provider_attribution || '',
      // tilelayer_provider_attribution_default: '<a target=\'_blank\' href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors',
      // countries: isoCountries,

const tilelayerTest = computed(() => {
  const v = tilelayer_provider !== '' ? tilelayer_provider : tilelayer_provider_default
  return v
})

const geocodingTest = computed(() => {
  const v = geocoding_provider !== '' ? geocoding_provider : geocoding_provider_default
  return v
})

async function testGeocodingProvider () {
  this.isNewGeocodingTest = true
  const currentGeocodingProvider = geolocation.getGeocodingProvider(settings.value.geocoding_provider_type)
  // random query
  const geocodingQuery = Math.random().toString(36).slice(2, 7);
  try {
    const ret = await this.$axios.$get(`placeOSM/${currentGeocodingProvider.commonName}/${geocodingQuery}`, { timeout: 3000 })
    const res = currentGeocodingProvider.mapQueryResults(ret)
    this.geocodingTestSuccess()
  } catch (e) {
    this.geocodingTestError()
  }
  this.isNewGeocodingTest = false
}

async function testTileLayerProvider () {
  this.isNewTilelayerTest = true
  this.mapPreview = true
  this.mapKey++
}
  //   done () {
  //     this.$emit('close')
  //   },
  //   handleMsg(t, s, c) {
  //     this.$root.$message(this.$t(t, { service_name: s }), { color: c })
  //   },
  //   geocodingTestError() {
  //     this.handleMsg('admin.geocoding_test_error', this.geocodingTest, 'error')
  //   },
  //   geocodingTestSuccess() {
  //     this.handleMsg('admin.geocoding_test_success', this.geocodingTest, 'success')
  //   },
  //   tilelayerTestError() {
  //     this.isNewTilelayerTest && this.handleMsg('admin.tilelayer_test_error', this.tilelayerTest, 'error')
  //     this.isNewTilelayerTest = false
  //   },
  //   tilelayerTestSuccess() {
  //     this.isNewTilelayerTest && this.handleMsg('admin.tilelayer_test_success', this.tilelayerTest, 'success')
  //     this.isNewTilelayerTest = false
  //   }

  // }
// }
</script>
<template>
<div class="d-flex flex-column ga-8 mt-4">
  <span v-html="$t('admin.geolocation_description')" />

  <div>
    <v-form>
      <v-row>
        <v-col cols="12" md="3">
          <v-autocomplete
            class="mb-4"
            v-model="geocoding_provider_type"
            @blur="save('geocoding_provider_type', geocoding_provider_type )"
            :label="$t('admin.geocoding_provider_type')"
            :hint="$t('admin.geocoding_provider_type_help')"
            persistent-hint
            :items="geocoding_provider_type_items"
            :placeholder="geocoding_provider_type_default" />
        </v-col>

        <v-col cols="12" md="5">
          <v-text-field
            class="mb-4"
            v-model="geocoding_provider"
            @blur="save('geocoding_provider', geocoding_provider )"
            :label="$t('admin.geocoding_provider')"
            :hint="$t('admin.geocoding_provider_help')"
            persistent-hint
            :placeholder="geocoding_provider_default" />
        </v-col>

        <v-col cols="12" md="4">
          <v-autocomplete
            class="mb-6"
            v-model="geocoding_countrycodes"
            :disabled="!(geocoding_provider_type === null || geocoding_provider_type === 'Nominatim')"
            :append-icon="mdiChevronDown"
            @blur="save('geocoding_countrycodes', geocoding_countrycodes )"
            :label="$t('admin.geocoding_countrycodes')"
            :items="countries"
            multiple
            chips
            persistent-hint
            item-value="code"
            item-title="name"
            :hint="$t('admin.geocoding_countrycodes_help')" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            class="mb-4"
            v-model="tilelayer_provider"
            @blur="save('tilelayer_provider', tilelayer_provider )"
            :label="$t('admin.tilelayer_provider')"
            :hint="$t('admin.tilelayer_provider_help')"
            persistent-hint
            :placeholder="tilelayer_provider_default" />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="tilelayer_provider_attribution"
            @blur="save('tilelayer_provider_attribution', tilelayer_provider_attribution )"
            :label="$t('admin.tilelayer_provider_attribution')"
            :placeholder="tilelayer_provider_attribution_default" />
        </v-col>
      </v-row>

      <Map
        :key="mapKey"
        v-if="mapPreview"
        @tileerror="tilelayerTestError"
        @tileload="tilelayerTestSuccess"
        :LMapStyles="{height:'20rem'}"
        :showMarker="false"
        :mapCenter="mapCenter"
        :zoom="10" />
    </v-form>
  </div>

  <div class="d-flex justify-end ga-4">
    <v-btn
      color="primary"
      @click="testGeocodingProvider"
      :loading="isNewGeocodingTest"
      variant='outlined'>
      {{$t('admin.geocoding_test_button')}}
    </v-btn>
    <v-btn
      color="primary"
      @click="testTileLayerProvider"
      :loading="isNewTilelayerTest"
      variant='outlined'>
      {{$t('admin.tilelayer_test_button')}}
    </v-btn>
  </div>
</div>

</template>
