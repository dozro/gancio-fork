<script setup>
defineProps ({
  tooltip: { type: String, default: '' },
  color: { type: String, default: '' },
  to: { type: String, default: '' },
  icon: { type: String, default: '' },
  large: { type: Boolean, default: false },
  small: { type: Boolean, default: false }
})

</script>
<template>
  <v-tooltip top>
    <template #activator="{ props }">
      <v-btn v-bind='props' :color='color' :icon='icon' variant='text' size='large'  @click='$emit("click")' />
    </template>
    <span>{{ $t(tooltip) }}</span>
  </v-tooltip>
</template>