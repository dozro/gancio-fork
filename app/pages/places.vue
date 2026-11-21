<script setup lang="ts">
const settings = useState<Settings>('settings')
const { t } = useI18n()
const { data: places } = await useFetch<PlaceAPI[]>(`/api/places/`)

useHead(() => {
  const title = `${settings.value.title} - ${t('common.places')}`
  return {
    title
  }
})

</script>
<template>
<v-container>
  <div v-for="place in places" :key='place.id'>
    <template v-if='place.listed'>
      <header>
        <h3>
          <nuxt-link
            class='place d-block pl-0'
            text
            :to="`/place/${place.id}/${encodeURIComponent(place.name)}`"
          >
            {{ place.name }}
          </nuxt-link>
        </h3>
      </header>
      <div>{{ place.address }}</div>
    </template>
  </div>
</v-container>
</template>
