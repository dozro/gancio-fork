<script setup>
const route = useRoute()
const { data: events } = useFetch('/api/event/search', { params: { search: route.query.search }})
</script>
<template>
<v-container id="home" fluid>
  <v-form class="ma-5" to='/search' action='/search' method='GET'>
    <v-text-field name='search' :label='$t("common.search")' :value='$route.query.search' hide-details outlined rounded append-icon='mdi-magnify' />
  </v-form>

  <section id="events" class="mb-2 mt-1 pl-1 pl-sm-2">
    <Event :event='event' @destroy='destroy' v-for='(event, idx) in events' :lazy='idx>2' :key='event.id' />
  </section>
</v-container>
</template>
