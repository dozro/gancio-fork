<script setup>
const { t } = useI18n()
const settings = useState('settings')

const form = ref()
const loading = ref(false)
const dialog = ref(false)
const valid = ref(false)
const address = ref('')
const search = ref('')
const place = reactive({ name: '', address: '', latitude: null, longitude: null, id: null })

const headers = [
  { value: 'name', title: t('common.name') },
  { value: 'address', title: t('common.address') },
  { value: 'map', title: 'Map' },
  { value: 'actions', title: t('common.actions'), align: 'end' }
]

const { data: places, refresh } = await useFetch('/api/places', {
  transform: places => places.filter(place => place.name?.toLowerCase() !== 'online')
})

//   methods: {
function editPlace(item) {
  place.name = item.name
  place.address = item.address
  if (settings.value.allow_geolocation) {
    place.geocodedAddress = ''
    place.latitude = item.latitude
    place.longitude = item.longitude
  }
  place.id = item.id
  dialog.value = true
}

async function savePlace() {
  const { valid } = await form.value.validate()
  if (!valid) {
    return
  }
  loading.value = true
  await $fetch('/place', {
    method: 'PUT',
    body: place
  })
  refresh()
  loading.value = false
  dialog.value = false
}
</script>
<template>
<div class="d-flex flex-column ga-4">
  <div class="text-subtitle-2 text-medium-emphasis" v-html="$t('admin.place_description')" />

  <div class="d-flex justify-end">
    <CoreSearchInput v-model="search" class="w-100 w-sm-25"/>
  </div>

  <v-dialog v-model="dialog" width="600" :fullscreen="$vuetify.display?.mobile">
    <v-card>
      <v-card-title>
        {{ $t('admin.edit_place') }}
      </v-card-title>
      <v-card-text class="mb-4">
        <v-form ref="form" v-model="valid">
          <v-text-field
            v-model="place.name"
            :rules="[$valid.required('common.name')]"
            :label="$t('common.name')"
            :placeholder="$t('common.name')"
          />
          <v-text-field
            ref="address"
            v-model="place.address"
            :rules="[ v => $valid.required('common.address')(v)]"
            :label="$t('common.address')"
            persistent-hint
          />
          <SearchAddress v-if="settings.allow_geolocation" v-model:place="place" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="outlined" color="warning" @click="dialog = false">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          color="primary"
          variant="outlined"
          :loading="loading"
          :disable="!valid || loading"
          @click="savePlace"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div>
    <v-data-table
      :headers="headers"
      :items="places"
      :hide-default-footer="places.length < 5"
      :search="search"
    >
      <template v-slot:item.map="{ item }">
        <v-icon v-if="item.latitude && item.longitude" icon='mdi-map-marker'/>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn color="primary" icon='mdi-pencil' @click="editPlace(item)" />
        <v-btn :to="`/place/${item.id}/${encodeURIComponent(item.name)}`" icon='mdi-eye' />
      </template>
    </v-data-table>
  </div>
</div>

</template>
