<script setup>

// const search = ref('')
// const place = ref('')

// const searchUrl = computed(() => `/api/places?q=${encodeURIComponent(search.value)}`)
// const { data } = await useFetch(searchUrl)
// const { isRequired } = useValidators()
// const { startMonth, currentMonth, currentYear } = useTime()

// const query = reactive({ start: startMonth(currentYear, currentMonth )})

// const { data: events = [] } = await useFetch('/api/events', { query })
// function updatePages (p) {
//   const start = p?.[0] ?? p
//   const newStartDate = startMonth(start.year, start.month)
//   if (newStartDate !== params.value.start) {
//     params.value.start = startMonth(start.year, start.month)
//   }
// }

// const attributes = computed(() => {
//   console.error('inside attributes?')
//   return events?.value?.map(e => e  ) ?? []
// })
// const { data, params } = useNewEvents()
const searchTag = ref('')
const selectedTags = ref([])
const { data: tags, status: statusTags } = await useFetch('/api/tags', { params: { query: searchTag } })

</script>
<template>
<v-container>
  <v-combobox
    v-model:search="searchTag" v-model="selectedTags" prepend-icon="mdi-tag-multiple" chips
    multiple closable-chips hide-no-data hide-selected persistent-hint
    :loading="statusTags === 'pending'" :delimiters="[',', ';']" :items="tags || []"
    :menu-props="{ maxWidth: 400, eager: true }" :label="$t('common.tags')" />
    <!-- <input type='checkbox' v-model='params.show_recurrent' /> -->
    
    <!-- <span>{{data?.length}}</span> -->
    <!-- <span>{{startDate}}</span> -->
    <!-- <DatePicker
      title-position='left'
      transition='fade'
      aria-label='Calendar'
      expanded
      @update:pages="updatePages" 
    /> -->


  <!-- <p>diocane  {{events.length}} {{$t('$vuetify.input.clear')}}</p> -->
  <!-- <p>SEARCH: {{search}}</p> -->
  <!-- <p>SELECTED: {{place}}</p> -->
  <!-- <v-combobox
    v-model='place'
    v-model:search="search" 
    :rules="[isRequired('common.where')]"
    :label="$t('common.where')"
    :hint="$t('event.where_description')"
    prepend-icon="mdi-map-marker" hide-no-data
    persistent-hint
    :items="data || []"
    hide-selected
    item-title="name"
    item-value="id" /> -->
</v-container>
</template>