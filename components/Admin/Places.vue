<script setup>
const { t } = useI18n()
const settings = useState('settings')

const loading = ref(false)
const dialog = ref(false)
const valid = ref(false)
const address = ref('')
const search = ref('')
const place = reactive({ name: '', address: '', latitude: null, longitude: null, id: null })

const headers = [
  { value: 'name', text: t('common.name') },
  { value: 'address', text: t('common.address') },
  { value: 'map', text: 'Map' },
  { value: 'actions', text: t('common.actions'), align: 'right' }
]

// @todo filter online place
const { data: places, refresh } = await useFetch('/api/places')

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
  const form = refs.form || (typeof $refs !== 'undefined' && $refs.form)
  if (!form || !form.validate()) return
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
<v-container>
  <v-card-title>
    {{ $t('common.places') }}
    <v-spacer />
    <v-text-field
      v-model="search"
      append-icon="mdi-magnify"
      outlined
      rounded
      :label="$t('common.search')"
      single-line
      hide-details
    />
  </v-card-title>
  <v-card-subtitle v-html="$t('admin.place_description')" />

  <v-dialog v-model="dialog" width="600" :fullscreen="$vuetify.display?.mobile">
    <v-card>
      <v-card-title>
        {{ $t('admin.edit_place') }}
      </v-card-title>
      <v-card-text class="mb-4">
        <v-form v-model="valid" ref="form" lazy-validation>
          <v-text-field
            :rules="[$validators.required('common.name')]"
            :label="$t('common.name')"
            v-model="place.name"
            :placeholder="$t('common.name')"
          />
          <v-text-field
            ref="address"
            :rules="[ v => $validators.required('common.address')(v)]"
            :label="$t('common.address')"
            v-model="place.address"
            persistent-hint
          />
          <SearchAddress v-if="settings.allow_geolocation" :place="place" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="dialog = false" outlined color="warning">
          {{ $t('common.cancel') }}
        </v-btn>
        <v-btn
          @click="savePlace"
          color="primary"
          outlined
          :loading="loading"
          :disable="!valid || loading"
        >
          {{ $t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-card-text>
    <v-data-table
      :headers="headers"
      :items="places"
      :hide-default-footer="places.length < 5"
      :search="search"
    >
      <template v-slot:item.map="{ item }">
        <v-icon v-if="item.latitude && item.longitude" icon='mdi-map-marker'></v-icon>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn @click="editPlace(item)" color="primary" icon='mdi-pencil' />
        <nuxt-link :to="`/place/${item.id}/${encodeURIComponent(item.name)}`" icon='mdi-eye' />
      </template>
    </v-data-table>
  </v-card-text>
</v-container>

</template>
