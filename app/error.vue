<script setup lang="ts">
const props = defineProps({ error: Object })

let zodIssues = null

if (props.error?.data?.name === 'ZodError') {
  zodIssues = JSON.parse(props.error?.data?.message)
}
</script>

<template>
  <NuxtLayout name="default">
    <v-container>
      <h1>{{ error?.statusMessage }}</h1>

      <div v-if="zodIssues">
        <ul>
          <li v-for="issue in zodIssues" :key="issue.path.join('.')">
            <strong>{{ issue.path.join('.') }}:</strong>
            {{ issue.message }}
          </li>
        </ul>
      </div>

      <NuxtLink to="/">{{ $t('common.home') }}</NuxtLink>
    </v-container>
  </NuxtLayout>
</template>
