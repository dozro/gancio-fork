<!-- Choose event location

-->
<script setup lang='ts'>
import { debounce } from 'vuetify/lib/util/helpers.mjs'

const settings = useState<Settings>('settings')

interface Place {
  name?: string,
  address?: string,
  online?: boolean,
  create?: boolean
}

const modelValue = defineModel('modelValue', { type: Object, default: () => ({ name: '', address: '' }) })

const whereInputAdvancedDialog = ref(false)
// const search = ref('')
const onlineLocations = ref([])
const disableAddress = ref(false)

const isOnLine = computed(() => settings.value.allow_online_event && modelValue.value.name === 'online')

const showAdvancedDialogButton = computed(() => {
  if (!modelValue.value.name) return false
  // do not show advanced dialog button in case geolocation is not allowed
  if (!(settings.value.allow_geolocation)) {
    return false
  }
  // known places already have coords
  if (!modelValue.value.isNew) return false
  return true
})

const places = ref<Place[]>([])

const search = debounce(async function(ev) {
  const query: string = ev ? ev.target.value.trim().toLowerCase() : ''
  places.value = await $fetch('/api/places', { query: { query } }).catch() as Place[]

  // Filter out the place with name 'online' if not allowed
  if (places.value.length) {
    places.value = places.value.filter(p => p.name?.toLocaleLowerCase() !== 'online')
  }
  if (settings.value.allow_online_event) {
    places.value.push({ online: true, name: 'online' })
  }

  if (!search && places.value.length) { 
    return places
  }
  const matches = places.value.find(p => query === p.name?.toLocaleLowerCase())
  if (!matches && query) {
    places.value.unshift({ create: true, name: ev.target.value.trim() })
  }
}, 200)
search()

// const { data: places = [], status } = await useFetch<Place[]>('/api/places', { params: { query: search },
//     transform: places => {
//       if (places) {
//         places.push()
//       }
//     })

</script>
<template>
<v-row class="mb-4">
  <v-col cols="12" md="4">
      <!-- v-model:search.trim.toLowerCase="search" -->
    <v-combobox
      ref="place"
      :rules="[$valid.required('common.where')]"
      :label="$t('common.where')"
      v-model='modelValue'
      prepend-icon="mdi-map-marker"
      hide-no-data
      @input='search'
      :hint="$t('event.where_description')"
      persistent-hint
      :items="places || []"
      item-title='name'
      item-value="id">
        
      <template #item="{ item, props }">
        <v-list-item v-bind='props'>
          <template #title v-if='item.raw.create'><v-list-item-title icon='mdi-plus'>{{ $t('common.add')}} {{ item.raw.name }}</v-list-item-title></template>
          <template #title v-else-if='item.raw.online'>online</template>
          <template #title v-else>{{ item.raw.name }}</template>
          <template #subtitle v-if='item.raw.address'>{{ item.raw.address }}</template>
          <!-- <v-list-item-title v-if="item?.create" prepend-icon='mdi-plus' color='primary':aria-label='$t("common.add")'> {{$t('common.add')}} <strong>{{item?.name}}</strong></v-list-item-title>
          <v-list-item-title v-else-if="item?.online" prepend-icon='mdi-laptop-account'
            color='primary' :aria-label='$t("common.online")'> {{$t('common.online')}}</v-list-item-title>
          <v-list-item-title v-else :title='item?.name' :subtitle='item?.address' /> -->
        </v-list-item>
      </template>
    </v-combobox>
  </v-col>
  
  <!-- address -->
  <v-col cols="12" :md="settings.allow_online_event?5:8" v-if="!isOnLine">
    <v-text-field
      class="mr-4" ref="address" v-model="modelValue.address" prepend-icon="mdi-map" :disabled="disableAddress" 
      :rules="[ v => disableAddress ? true : $valid.required('common.address')(v)]" :label="$t('common.address')"
      :hint="$t('event.address_description')" persistent-hint>
      <template v-if="showAdvancedDialogButton" #append>
        <t-btn tooltip="admin.geolocation" size="small" icon='mdi-map-search' @click="whereInputAdvancedDialog = true" />
      </template>
    </v-text-field>
  </v-col>
  
  <v-col cols="12" :md="isOnLine?8:3" v-if="settings.allow_online_event">
    <span>{{ onlineLocations }}</span>
    <v-combobox
      class="mr-4" v-model="onlineLocations"
      prepend-icon="mdi-link" :hint="$t('event.online_locations_help')"
      :label="$t('event.online_locations')"
      :rules="isOnLine ? [$valid.required('event.online_locations')] : []"
      clearable chips
      multiple
      closable-chips
      hide-no-data
      hide-selected
      persistent-hint
      :delimiters="[',', ';', '; ']" :items="onlineLocations" />
      <!-- <template #chip="{ item, index, props }">
        <v-chip v-bind="props" :outlined="index !== 0" closable close-icon="mdi-close-circle" @click:close="label="label" small="small">{{ item }}</v-chip>
      </template> -->
    <!-- </v-combobox> -->
  </v-col>
  <!-- <v-dialog v-model="whereInputAdvancedDialog" destroy-on-close="destroy-on-close" max-width="700px" :fullscreen="$vuetify.display.mobile" dense="dense">
    <WhereInputAdvanced ref="whereAdvanced" :place.sync="value" :event="event" @close="whereInputAdvancedDialog = false && this.$refs.address.blur()" :onlineLocations.sync="onlineLocations" @update:onlineLocations="selectLocations"></WhereInputAdvanced>
  </v-dialog> -->
</v-row>
    
</template>
<!-- // import { mdiMap, mdiMapMarker, mdiPlus, mdiCog, mdiLink, mdiCloseCircle, mdiLaptopAccount, mdiMapSearch } from '@mdi/js'
// import { mapState } from 'vuex'
// import debounce from 'lodash/debounce'
// import WhereInputAdvanced from './WhereInputAdvanced.vue'
// import TBtn from '../components/TBtn.vue'

// export default {
//   name: 'WhereInput',
//   props: {
//     value: { type: Object, default: () => ({}) },
//     event: { type: Object, default: () => null },
//   },
//   components: { WhereInputAdvanced, TBtn },
//   data ( {$store} ) {
//     return {
//       mdiMap, mdiMapMarker, mdiPlus, mdiCog, mdiLink, mdiCloseCircle, mdiLaptopAccount, mdiMapSearch,
//       places: [],
//       place: { isNew: false, name: '' },
//       placeName: '',
//       disableAddress: true,
//       whereInputAdvancedDialog: false,
//       onlineLocations: this.event.online_locations || [],
//     }
//   },
//   computed: {
//     ...mapState(['settings']),
//     isOnLine () {
//       return this.settings.allow_online_event && this.place.name === 'online'
//     },
//     showAdvancedDialogButton () {
//       if (!this.place.name) return false
//       // do not show advanced dialog button in case geolocation is not allowed
//       if (!(this.settings.allow_geolocation)) {
//         return false
//       }
//       // known places already have coords
//       if (!this.place.isNew) return false
//       return true
//     }
//   },
//   mounted () {
//     this.$nextTick( () => {
//       this.search()
//     })
//   },
//   methods: {
//     search: debounce(async function(ev) {
//       const search = ev ? ev.target.value.trim().toLowerCase() : ''
//       this.places = await this.$axios.$get('place', { params: { search } }).catch()

//       // Filter out the place with name 'online' if not allowed
//       if (this.places.length) {
//         this.places = this.places.filter(p => p.name?.toLocaleLowerCase() !== 'online')
//       }
//       if (this.settings.allow_online_event) {
//         this.places.push({ online: true, name: 'online' })
//       }

//       if (!search && this.places.length) { 
//         return this.places 
//       }
//       const matches = this.places.find(p => search === p.name.toLocaleLowerCase())
//       if (!matches && search) {
//         this.places.unshift({ create: true, name: ev.target.value.trim() })
//       }
//     }, 200),
//     selectPlace (p) {
//       // force online events under place: online address: online
//       // this.event_only_online = false
//       this.place.isNew = false
//       // this.whereAdvancedId++

//       if (!p) { return }
//       if (typeof p === 'object' && !p.create && !p.online) {
//         if (p.id === this.value.id) return
//         this.place.name = p.name
//         this.place.address = p.address
//         if (this.settings.allow_geolocation) {
//           this.place.latitude = p.latitude
//           this.place.longitude = p.longitude
//         }
//         this.place.id = p.id
//         // if (this.settings.allow_event_only_online && this.place.name === 'online') {
//         //   this.event_only_online = true 
//         // }
//         this.disableAddress = true
//       } else { // this is a new place
//         this.place.isNew = true
//         this.place.name = (p.name || p).trim()
//         const tmpPlace = this.place.name.toLocaleLowerCase()
//         // search for a place with the same name
//         const place = this.places.find(p => !p.create && p.name.trim().toLocaleLowerCase() === tmpPlace)
//         if (place) {
//           this.place.name = place.name
//           this.place.id = place.id
//           this.place.address = place.address
//           this.disableAddress = true
//         } else {
//           delete this.place.id
//           this.place.address = ''
//           if (this.settings.allow_geolocation) {
//             this.place.latitude = p.latitude
//             this.place.longitude = p.longitude
//           }
//           this.disableAddress = false
//           this.$refs.place.blur()
//           this.$nextTick(() => { this.$refs.address && this.$refs.address.focus() })
//         }
//       }
//       this.$emit('input', { ...this.place })
//     },
//     selectLocations () {
//       this.event.online_locations = []

//       if (this.onlineLocations) {
//         // Insert up to 3 online location: the main one and 2 fallback
//         if (this.onlineLocations.length > 3) {
//           this.$nextTick(() => this.onlineLocations = this.onlineLocations.slice(0, 3))
//         }
//         // Remove duplicates
//         this.$nextTick(() => this.onlineLocations = [...new Set(this.onlineLocations)])
        
//         this.onlineLocations.forEach((item, i) => {
//           if (!item.startsWith('http')) { this.onlineLocations[i] = `https://${item}` }
//           this.event.online_locations[i] = this.onlineLocations[i]
//         })
//       }
//     },
//   }
// } -->
