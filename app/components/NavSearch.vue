<script setup lang="ts">
const settings = useState<Settings>('settings')

const route = useRoute()

const in_home = computed(() => route.name === 'index')
const show_calendar = computed(() => !settings.value.hide_calendar && in_home.value)

const { data: collections } = await useFetch<Collection[]>('/api/collections/home')

const show_collections_bar = computed(() => ['index', 'collection-name'].includes(route.name))// true  // TODO

</script>

<template>
  <div id="navsearch" class="mt-2 mt-sm-4" v-if='show_collections_bar || show_calendar'>
    <div class="mx-2">
      <span v-if="show_collections_bar">
        <v-btn class="mr-2 mt-2" size='small' variant="outlined" v-for="collection in collections" color="primary" :key="collection.id"
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