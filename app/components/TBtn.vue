<script setup>
defineProps ({
  tooltip: { type: String, default: '' },
  color: { type: String, default: '' },
  to: { type: String, default: '' },
  icon: { type: String, default: '' },
  size: { type: String, default: 'small' },
})

</script>
<template>
  <v-tooltip top>
    <template #activator="{ props }">
      <v-btn v-bind='props' :color='color' :icon='icon' variant='text' :size='size'  @click='$emit("click")' :to='to' />
    </template>
    <span>{{ $t(tooltip) }}</span>
  </v-tooltip>
</template>