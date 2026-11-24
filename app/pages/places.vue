<script setup lang="ts">
const settings = useState<Settings>('settings')
const { t } = useI18n()
const { data: places } = await useFetch(`/api/places/listed`)

useHead(() => {
  const title = `${settings.value.title} - ${t('common.places')}`
  return {
    title
  }
})

</script>
<template>
<v-container>
  <h1>{{ t('common.places') }}</h1>
  <v-list rounded>
    <v-list-item
      v-for="place in places"
      :key='place.id'
      :title='place.name'
      :subtitle='place.address'
      :to="`/place/${place.id}/${encodeURIComponent(place.name)}`" />
  </v-list>
</v-container>
</template>
