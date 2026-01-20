<script setup lang="ts">
const model = defineModel<string>()
</script>
<template>
<div class="search-container d-flex">
  <v-text-field
    v-model="model"
    prepend-inner-icon="mdi-magnify"
    :label="$t('common.search')"
    single-line
    hide-details
    variant="outlined"
    density="compact"
  />
</div>
</template>
<style scoped>
  .search-container {
    min-width: min(320px, 100%);
  }
</style>
