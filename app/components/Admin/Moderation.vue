<script setup lang="ts">
import SearchInput from '../Core/SearchInput.vue'

const { t } = useI18n()
const { $confirm } = useNuxtApp()

const instancesHeader = computed(() => [
  { value: 'name', title: t('common.name'), sortable: true },
  { value: 'users', align: 'center', width: 64, sortable: true },
  { value: 'blocked', align: 'center', width: 64, sortable: true }
] as const)

const instancesFilter = ref<string>('')
const selectedInstance = ref<string | undefined>()

function onInstanceRowClick (_, row) {
  const domain = row.item.domain
  selectedInstance.value = selectedInstance.value === domain ? undefined : domain
  console.log('usersTable', usersTable.value.$el)
  usersTable.value?.$el.scrollIntoView({ behavior: 'smooth' })
}

const usersHeader = computed(() => [
  { value: 'preferredUsername', title: t('common.name'), sortable: true },
  { value: 'blocked', align: 'center', width: 64, sortable: true }
] as const)

const usersFilter = ref<string>('')
const usersTable = ref()

const resourcesHeader = computed(() => [
  { value: 'created', text: t('admin.created_at') },
  { value: 'event', text: t('common.event') },
  { value: 'user', text: t('common.user') },
  { value: 'content', text: t('common.content') },
  { value: 'actions', text: t('common.actions') }
])

const { data: instances = [], refresh: refreshInstances } = await useFetch('/api/instances')
const { data: users = [], refresh: refreshUsers } = await useFetch(`/api/ap_actors`, {
  query: { instance: selectedInstance }
})
const { data: resources = [] } = await useFetch('/api/resources')

async function hideResource (resource, hidden) {
  await $fetch(`/resources/${resource.id}`, { method: 'POST', body: hidden })
  resource.hidden = hidden
}

async function toggleUserBlock (ap_user) {
  if (!ap_user.blocked) {
    const ret = await $confirm('admin.user_block_confirm', { user: `@${ap_user.preferredUsername}@${ap_user.domain}` })
    if (!ret) {
      return
    }
  }
  await $fetch('/api/ap_actors/toggle_block', { method: 'PUT', body: { ap_id: ap_user.ap_id } })
  refreshUsers()
}

async function deleteResource (resource) {
  const ret = await $confirm('admin.delete_resource_confirm')
  if (!ret) {
    return
  }

  await $fetch(`/resources/${resource.id}`, { method: 'DELETE' })
  resources = resources.filter(r => r.id !== resource.id)
}

async function toggleInstanceBlock (instance) {
  if (!instance.blocked) {
    const ret = await $confirm('admin.instance_block_confirm', { instance: instance.domain })
    if (!ret) {
      return
    }
  }
  await $fetch('/api/instances/block', { method: 'PUT', body: { domain: instance.domain, blocked: !instance.blocked } })
  refreshInstances()
}
</script>

<template >
<div class="mt-4">
  <v-row class="mt-4">
    <v-col :cols="12" :lg="6">
      <div class="text-h5 mb-4">{{ $t('common.instances') }}</div>
      <SearchInput v-model="instancesFilter" :label="$t('admin.filter_instances')" class="mb-2" />
      <v-data-table
        :items="instances"
        :items-per-page="5"
        :hide-default-footer="!instances || instances.length < 5"
        :search="instancesFilter"
        :sort-by="[{ key: 'blocked', order: 'desc' }, { key: 'name' }]"
        density="compact"
        class="table-ultra-compact"
        :headers="instancesHeader"
        item-value="domain"
        :row-props="(data) => ({ class: { 'row-selected': selectedInstance === data.item.domain } })"
        @click:row="onInstanceRowClick"
      >
        <template #item.name="{ item }">
          <div class="font-weight-semibold">{{ item.name }}</div>
          <NuxtLink :to="`https://${item.domain}`" target="_blank">{{ item.domain }}</NuxtLink>
        </template>
        <template #item.users="{ item }">
          <v-btn :title="t('admin.known_users')" prepend-icon="mdi-account-multiple-outline">
            {{ item.users }}
          </v-btn>
        </template>
        <template #item.blocked="{ item }">
          <v-btn
            :icon="item.blocked ? 'mdi-cancel' : 'mdi-checkbox-blank-circle-outline'"
            :title="item.blocked ? t('admin.blocked') : t('admin.block')"
            :color="item.blocked ? 'error' : undefined"
            @click.stop="toggleInstanceBlock(item)"
          />
        </template>
      </v-data-table>
    </v-col>

    <v-col ref="usersTable" :cols="12" :lg="6">
      <div class="text-h5 mb-4">{{ $t('common.users') }}</div>
      <SearchInput v-model="usersFilter" :label="$t('admin.filter_users')" class="mb-2" />
      <v-data-table
        :items="users"
        :items-per-page="5"
        :hide-default-footer="!users || users.length < 5"
        :search="usersFilter"
        :sort-by="[{ key: 'blocked', order: 'desc' }, { key: 'name' }]"
        density="compact"
        class="table-ultra-compact"
        :headers="usersHeader"
      >
        <template v-slot:item.preferredUsername="{ item }">
          <div class="font-weight-semibold">{{ item.name }}</div>
          <div>{{ `@${item.preferredUsername}@${item.domain}` }}</div>
        </template>
        <template #item.blocked="{ item }">
          <v-btn
            :icon="item.blocked ? 'mdi-cancel' : 'mdi-checkbox-blank-circle-outline'"
            :title="item.blocked ? t('admin.user_blocked', { user: `@${item.preferredUsername}@${item.domain}` }) : t('admin.block_user')"
            :color="item.blocked ? 'error' : undefined"
            @click.stop="toggleUserBlock(item)"
          />
        </template>
      </v-data-table>
    </v-col>
  </v-row>

  <v-divider class="my-8"/>

  <div>
    <div class="text-h5 mb-4">{{ $t('common.resources') }}</div>
    To be implemented...
    <!-- <v-data-table
      :items="resources"
      density="compact"
      :headers="resourcesHeader"
      :hide-default-footer="resources.length<10"
      :items-per-page="10"
    >
      <template v-slot:item.content="{ item }">
        <span v-html="item.data.content" />
      </template>
      <template v-slot:item.created="{ item }">
        <span>{{ $time.format(item.created, 'ff') }}</span>
      </template>
      <template v-slot:item.user="{ item }">
        <a :href="item.ap_user.url || item.ap_user.ap_id" target="_blank">{{ item.ap_user.preferredUsername }}</a>
      </template>
      <template v-slot:item.event="{ item }">
        <nuxt-link :to="`/event/${item.event.slug || item.event.id}`">{{ item.event.title }}</nuxt-link>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn class="mr-2" v-bind="props" color="primary" size="small" icon='mdi-dots-vertical' />
          </template>
          <v-list>
            <v-list-item v-if="!item.hidden" @click="hideResource(item, true)">
              <v-list-item-title>
                <v-icon start icon='mdi-eye-off' />
                {{ $t('admin.hide_resource') }}
              </v-list-item-title>
            </v-list-item>
            <v-list-item v-else @click="hideResource(item, false)">
              <v-list-item-title>
                <v-icon start icon='mdi-eye' />
                {{ $t('admin.show_resource') }}
              </v-list-item-title>
            </v-list-item>
            <v-list-item @click="deleteResource(item)">
              <v-list-item-title>
                <v-icon start icon='mdi-delete' />
                {{ $t('admin.delete_resource') }}
              </v-list-item-title>
            </v-list-item> -->
    <!--
            <v-list-item @click="toggleUserBlock(item.ap_user)">
              <v-list-item-title>
                <v-icon left>mdi-lock</v-icon>
                {{ $t('admin.block_user') }}
              </v-list-item-title>
            </v-list-item>
            -->
    <!-- </v-list>
        </v-menu>
      </template>
    </v-data-table> -->
  </div>
</div>
</template>
<style lang="css" scoped>
.table-ultra-compact :deep(th),
.table-ultra-compact :deep(td)
{
  padding-inline-end: 0 !important;
}

:deep(.row-selected) {
  background: rgba(var(--v-theme-on-surface), calc(var(--v-hover-opacity) * var(--v-theme-overlay-multiplier)));
  transition: background-color 0.2s ease-in-out
}
</style>
