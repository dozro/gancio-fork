<script setup lang="ts">

const route = useRoute()
const { t } = useI18n()
const { $notify } = useNuxtApp()

const { data: announcement, refresh } = await useFetch<Announcement>(`/api/announcements/${route.params.id}`)

if (!announcement.value) {
  throw createError({ statusCode: 404, statusMessage: 'Announcement Not Found' })
}

useHead({ title: `Announce - ${announcement.value.title}` })

async function toggleVisibility() {
  if (!announcement.value) {
    return
  }

  try {
    await $fetch(`/api/announcements/${announcement.value.id}`, {
      method: 'PUT',
      body: { ...announcement.value, visible: true }
    })
    refresh()
    $notify(t('common.enabled'))
  } catch (e) {
    $notify(String(e))
  }
}

</script>

<template>
<v-container>
  <v-alert v-if="!announcement?.visible" type="warning" rounded class="mb-4">
    <span class="font-weight-semibold">{{ $t('admin.announcement_is_disabled')}}</span>
    <template #append>
      <v-btn color="warning" @click="toggleVisibility">{{ $t('common.enable') }}</v-btn>
    </template>
  </v-alert>
  <v-card>
    <v-card-title class='text-h5 font-weight-bold'>{{announcement?.title}}</v-card-title>
    <v-card-text>
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-html='announcement?.announcement' />
    </v-card-text>
  </v-card>
</v-container>
</template>
