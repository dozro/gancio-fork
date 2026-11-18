<script setup lang="ts">
const props = defineProps<{ event: EventAPI }>()
const getStatus = useEventStatus()
const status = computed(() => getStatus(props.event.status))
</script>

<template>
<v-alert
  v-if="status"
  border="bottom"
  :color="status.color">
  {{status.title}}
  <meta itemprop="eventStatus" :content="props.event.status">
</v-alert>
</template>
