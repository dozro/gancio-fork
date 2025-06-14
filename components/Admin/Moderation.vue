<script setup>
const { t } = useI18n()

const usersHeader = [
  { value: 'object.preferredUsername', text: t('common.name') },
  { value: 'blocked', text: t('admin.blocked') }
]

const instancesHeader = [
  { value: 'domain', text: t('admin.domain') },
  { value: 'name', text: t('common.name') },
  { value: 'blocked', text: t('admin.blocked') },
  { value: 'users', text: t('admin.known_users') }
]

const resourcesHeader = [
  { value: 'created', text: t('admin.created_at') },
  { value: 'event', text: t('common.event') },
  { value: 'user', text: t('common.user') },
  { value: 'content', text: t('common.content') },
  { value: 'actions', text: t('common.actions') }
]
 
const { data: instances } = await useFetch('/api/instances')
const { data: users } = await useFetch(`/api/instances/${instances[0].domain}`)
const { data: resources } = await useFetch('/api/resources')

// function resourceStyle ({ row }) {
//   if (row.hidden) {
//     return { opacity: 0.5 }
//   }
// }

// async function instanceSelected (instance) {
//   this.users = await this.$axios.$get(`/instances/${instance.domain}`)
//   this.resources = await this.$axios.$get('/resources', { filters: { instance: instance.domain } })
// }
// 
async function hideResource (resource, hidden) {
  await $fetch(`/resources/${resource.id}`, { method: 'POST', body: hidden })
  resource.hidden = hidden
}

async function toggleUserBlock (ap_user) {
  if (!ap_user.blocked) {
    const ret = await $confirm('admin.user_block_confirm', { user: ap_user?.object?.preferredUsername })
    if (!ret) { return }
  }
  await $fetch('/ap_actors/toggle_block', { method: 'POST', body: { ap_id: ap_user.ap_id }})
  ap_user.blocked = !ap_user.blocked
}

async function deleteResource (resource) {
  const ret = await $confirm('admin.delete_resource_confirm')
  if (!ret) { return }

  await $fetch(`/resources/${resource.id}`, { method: 'DELETE' })
  resources = resources.filter(r => r.id !== resource.id)
}

async function toggleBlock (instance) {
  if (!instance.blocked) {
    const ret = await $confirm('admin.instance_block_confirm', { instance: instance.domain })
    if (!ret) { return }
  }
  await $fetch('/instances/toggle_block', { method: 'POST', body: { instance: instance.domain, blocked: !instance.blocked } })
  instance.blocked = !instance.blocked
}
</script>

<template >
<v-container>
  <v-card-title>{{ $t('common.moderation') }}</v-card-title>
  <v-card-text>
    <v-row>
      <v-col :span="12">
        <span>{{ $t('common.instances') }}</span>
        <v-text-field v-model="instancesFilter" :placeholder="$t('admin.filter_instances')" />
        <v-data-table
          :items="instances"
          :items-per-page="5"
          :search="instancesFilter"
          :hide-default-footer="instances.length<5"
          dense
          :headers="instancesHeader"
          @click:row="instanceSelected"
        >
          <template v-slot:item.blocked="{ item }">
            <v-icon @click="toggleBlock(item)" icon="item.blocked ? 'mdi-checkbox-intermediate' : 'mdi-checkbox-blank-outline'" />
          </template>
        </v-data-table>
      </v-col>

      <v-col :span="11">
        <span>{{ $t('common.users') }}</span>
        <v-text-field v-model="usersFilter" :placeholder="$t('admin.filter_users')" />
        <v-data-table
          :items="users"
          :items-per-page="5"
          :search="usersFilter"
          :hide-default-footer="users.length<5"
          dense
          :headers="usersHeader"
        >
          <template v-slot:item.blocked="{ item }">
            <v-icon @click="toggleUserBlock(item)" v-text="item.blocked ? 'mdi-checkbox-intermediate' : 'mdi-checkbox-blank-outline'" />
          </template>
        </v-data-table>
      </v-col>
    </v-row>

    <div>
      <v-card-title>{{ $t('common.resources') }}</v-card-title>
      <v-data-table
        :items="resources"
        dense
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
          <v-menu offset-y>
            <template v-slot:activator="{ on }">
              <v-btn class="mr-2" v-on="on" color="primary" small icon='mdi-dots-vertical' />
            </template>
            <v-list>
              <v-list-item v-if="!item.hidden" @click="hideResource(item, true)">
                <v-list-item-title>
                  <v-icon left v-text="mdiEyeOff"></v-icon>
                  {{ $t('admin.hide_resource') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item v-else @click="hideResource(item, false)">
                <v-list-item-title>
                  <v-icon left v-text="mdiEye"></v-icon>
                  {{ $t('admin.show_resource') }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item @click="deleteResource(item)">
                <v-list-item-title>
                  <v-icon left v-text="mdiDelete"></v-icon>
                  {{ $t('admin.delete_resource') }}
                </v-list-item-title>
              </v-list-item>
              <!--
              <v-list-item @click="toggleUserBlock(item.ap_user)">
                <v-list-item-title>
                  <v-icon left>mdi-lock</v-icon>
                  {{ $t('admin.block_user') }}
                </v-list-item-title>
              </v-list-item>
              -->
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </div>
  </v-card-text>
</v-container>
</template>
