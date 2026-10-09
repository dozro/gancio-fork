<script setup lang="ts">
const settings = useState<Settings>('settings')

const url = useRequestURL().origin
const { data: selfReachable, status } = useLazyFetch('/api/utils/reachable', { server: false })

</script>
<template>
<v-alert v-if='url!==settings.baseurl' rounded="0" flat type='warning' show-icon icon='mdi-alert'>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-html="$t('admin.wrong_domain_warning', { url, baseurl: settings.baseurl })" />
</v-alert>
<v-alert v-if="!['idle', 'pending'].includes(status) && !selfReachable" rounded="0" flat type='warning' show-icon icon='mdi-alert' >
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-html="$t('admin.not_reachable_warning', { baseurl: settings.baseurl })" />
</v-alert>
</template>
