<script setup lang="ts">
const props = defineProps<{
  title?: string,
  events: EventAPI[],
  maxEvents?: number
}>()

const computedEvents = computed(() => {
     if (!props.maxEvents) { return props.events }
     return props.events.slice(0, props.maxEvents)
})

</script>
<template>
  <v-list id='list' nav density="compact">
    <v-list-item>
      <h3 v-if='title'>{{ title}}</h3>
    </v-list-item>
    <v-list-item
      density="compact"
      target='_blank'
      v-for='event in computedEvents'
      :to='`/event/${event.slug || event.id}`'
      :key='`sameday_${event.id}`'
    >
      <v-list-item-subtitle>
          <v-icon small color='success' v-if='event.parentId' icon='mdi-repeat' />
          {{ time.when(event)}}
        <span class='text-primary ml-1'>@{{event?.place?.name}}</span>
      </v-list-item-subtitle>
      <v-list-item-title v-text='event.title' />
    </v-list-item>
  </v-list>      
</template>

<style scoped>
#list {
  max-width: 500px;
  margin: 0 auto;
}

</style>