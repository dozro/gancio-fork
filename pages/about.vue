<script setup lang="ts">
const { data } = await useFetch('/api/settings/about')
</script>
<template>
  <v-container>
    <v-card-text v-html="data" />
  </v-container>
</template>