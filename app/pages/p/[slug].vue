<script setup lang="ts">

const settings = useState<Settings>('settings')

const route = useRoute()
const { data: page } = await useFetch<Page>(`/api/pages/${route.params.slug}`)

if (!page.value) {
  throw createError({ status: 404, statusMessage: 'Page not found' })
}

useHead(() => {
  const title = `${settings.value.title} - ${page.value?.title}`
  return {
    title,
  }
})

</script>
<template>
<v-container>
  <v-card>
    <v-card-title class='text-h4 font-weight-bold'>{{ page?.title }}</v-card-title>
    <v-card-text v-html='page?.content' />
  </v-card>
</v-container>
</template>
