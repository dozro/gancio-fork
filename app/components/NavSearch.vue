<script setup lang="ts">

const settings = useState<Settings>('settings')
const route = useRoute()

const { data: collections } = await useFetch<Collection[]>('/api/collections/home')

const show_calendar = computed(() => !settings.value?.hide_calendar && route?.name === 'index')
const show_collections_bar = computed(() => ['index', 'collection-name'].includes(route?.name))

</script>

<template>
<div id="navsearch" class="mt-2 mt-sm-4">
  <div class="mx-2">
    <span v-show="show_collections_bar">
      <v-btn
        v-for="collection in collections" :key="collection.id" class="mr-2 mt-2" size='small' variant="outlined" color="primary"
        :to="`/collection/${encodeURIComponent(collection.name)}`">{{ collection.name }}</v-btn>
    </span>

    <!-- Calendar -->
    <CoreCalendar v-if='show_calendar' />

  </div>
</div>
</template>

<style>
#navsearch {
margin: 0 auto;
max-width: 700px;
}
</style>
