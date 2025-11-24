<script setup lang="ts">
const props = defineProps({ error: Object })
</script>

<template>
  <NuxtLayout name="default">
    <v-container>
      <h1>{{ error?.statusMessage }}</h1>
      <NuxtLink to="/">{{ $t('common.home') }}</NuxtLink>
    </v-container>
  </NuxtLayout>
</template>
