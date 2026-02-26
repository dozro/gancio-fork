<script setup lang="ts">
import debounce from 'lodash/debounce'

const settings = useState<Settings>('settings')
const route = useRoute()

const { params, pending } = useEvents()
const onSearchChanged = debounce((value) => {
  params.value.query = value || undefined
  navigateTo({ query: { query: params.value.query } })
}, 500)

const { data: collections } = await useFetch<Collection[]>('/api/collections', { query: { pin: true } })

const show_search = computed(() => route?.name === 'index')
const show_calendar = computed(() => !settings.value?.hide_calendar && route?.name === 'index')
const show_collections_bar = computed(() => ['index', 'collection-name'].includes(route?.name))
const isCalendarDisabled = computed(oldValue => pending.value ? oldValue : !!params.value.query)
</script>

<template>
<div id="navsearch" class="mt-2 mt-sm-4">
  <div class="mx-2">
    <v-text-field
      v-if="show_search"
      id="main-search"
      class="bg-transparent-semi"
      color="primary"
      variant="outlined"
      density="comfortable"
      hide-details
      :placeholder="$t('common.search')"
      clearable
      :model-value="params.query"
      prepend-inner-icon="mdi-magnify"
      @update:model-value="onSearchChanged"
    />
    <div v-if="show_collections_bar">
      <v-btn
        v-for="collection in collections"
        :key="collection.id"
        class="mr-2 mt-2 bg-transparent-semi"
        size='small'
        variant="outlined"
        color="primary"
        :to="`/collection/${encodeURIComponent(collection.name)}`"
      >
        {{ collection.name }}
      </v-btn>
    </div>

    <!-- Calendar -->
    <template v-if='show_calendar'>
      <div v-show='!isCalendarDisabled'>
        <CoreCalendar />
      </div>
    </template>

  </div>
</div>
</template>

<style>
#navsearch {
margin: 0 auto;
max-width: 700px;
}

.bg-transparent-semi {
  background: var(--bg-transparent-semi);
  backdrop-filter: blur(4px);
}

.v-theme--light {
  --bg-transparent-semi: rgba(250,250,250,0.5);
}

.v-theme--dark {
  --bg-transparent-semi: rgba(10,10,10,0.5);
}
</style>
