<script setup lang="ts">

const { $notify } = useNuxtApp()
const { isAdmin } = useAuth()
const { t } = useI18n()
const { data } = await useFetch<string>('/api/settings/about')
const about = ref(data || t('about'))

function save() {
  $notify('common.ok', Statuses.SUCCESS )
  // setSetting({ key: 'about', value: about })
}
</script>
<template>
  <v-container>
    <v-card-text v-if='isAdmin'>
      <CoreEditor class='px-3 ma-0' v-model='about' :label="t('common.about')" height='500px' />
    </v-card-text>
    <v-card-text v-html="about" />
    <v-card-actions>
      <v-spacer />
      <v-btn color='primary' variant='outlined' @click='save'> {{t('common.save')}}</v-btn>
    </v-card-actions>
  </v-container>
</template>