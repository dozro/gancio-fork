<script setup>
defineProps ({
  tooltip: { type: String, default: '' },
  color: { type: String, default: '' },
  to: { type: String, default: '' },
  icon: { type: String },
  density: { type: String, default: 'comfortable' },
  size: { type: String, default: 'large' },
  variant: { type: String, default: 'plain' }
})

</script>
<template>
  <v-tooltip top>
    <template #activator="{ props }">
      <v-btn v-bind='props' :color='color' :icon='icon' :variant='variant' :size='size' :density='density' @click='$emit("click")' :to='to' />
    </template>
    <span>{{ $t(tooltip) }}</span>
  </v-tooltip>
</template>