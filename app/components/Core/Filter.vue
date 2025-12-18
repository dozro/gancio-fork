<script setup>
import debounce from 'lodash/debounce'

const modelValue = defineModel('modelValue' , { type: Object, default: () => ({ }) })
const settings = useState('settings')

const { data: collections } = await useFetch('/api/collections')

const searchTag = ref('')
const tags = ref([])
const fetchTags = debounce(async () => {
  try {
    const response = await $fetch(`/api/tags?query=${encodeURIComponent(searchTag.value)}`)
    tags.value = response
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}, 200)


const searchPlace = ref('')
const places = ref([])
const fetchPlaces = debounce(async () => {
  try {
    const response = await $fetch(`/api/places?query=${encodeURIComponent(searchPlace.value)}`)
    places.value = response
  } catch (error) {
    console.error('Failed to fetch places:', error)
  }
}, 200)

onMounted(() =>  {
  fetchTags()
  fetchPlaces()
})

 
</script>

<template>
<div class="v-row">

  <!-- filter recurrent event -->
  <div class="v-col" sm="3" cols="12" v-if="settings.allow_recurrent_event">
    <v-switch
      v-if="settings.allow_recurrent_event"
      v-model="modelValue.show_recurrent"
      :label="$t('event.show_recurrent')"
    />
  </div>

  <v-col>
    <v-autocomplete
      :label="$t('common.tags')"
      variant='outlined'
      chips
      closable-chips
      multiple
      :items="tags"
      @update:search="searchTag"
      v-model="modelValue.tags"
    />
  </v-col>

  <v-col>
    <v-autocomplete
      :label="$t('common.places')"
      variant="outlined"
      chips
      closable-chips
      multiple
      :items="places"
      @update:search="searchPlace"
      v-model="modelValue.places"
      item-value="id"
      item-id="id"
      item-title="name"
      item-subtitle="address"
    />
  </v-col>
  
  <v-col sm="4" cols="12" v-if='collections?.length'>
    <v-autocomplete
      class="p-0"
      v-model="modelValue.collection"
      variant='outlined'
      :label="$t('common.collections')"
      hide-details
      color="primary"
      hide-selected
      :menu-props="{ maxWidth: '400' }"
      :items="collections"
      hide-no-data
      clearable
      item-title="name"
    />
  </v-col>
</div>

</template>