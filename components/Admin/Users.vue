<script setup>
import { Statuses } from "~/types/settings"
const { $notify, $confirm } = useNuxtApp()
const { t } = useI18n()

// const props = defineProps({ users: { type: Array, default: () => [] } })

const { data: users, refresh } = await useFetch('/api/users')
const search = ref('')
const newUserDialog = ref(false)
const changeRoleDialog = ref(false)
const roleColors = { admin: 'error', editor: 'warning', user: 'success' }
const valid = ref(false)
const loading = ref(false)
const userForm = ref()

let newUser = reactive({})

const headers = [
  { key: 'email', title: t('common.email'), width: 150 },
  { key: 'description', title: t('common.description') },
  { key: 'is_active', title: t('common.enabled'), width: 50 },
  { key: 'to_notify', title: t('admin.receive_confirm_notification'), width: 50 },
  { key: 'role', title: t('common.role'), width: 150 },
  // { value: 'is_editor', text: t('common.editor') },
  { key: 'actions', title: t('common.actions'), align: 'right', width: 100, sortable: false }
]

async function toggle (user) {
  // ask confirmation only to disable
  if (user.is_active) {

    const ret = await $confirm('admin.disable_user_confirm', { user: user.email })
    if (!ret) { return }
  }
  user.is_active = !user.is_active
  $fetch('/api/user', { method: 'PUT', body: user })
}

async function deleteUser (user) {
  const ret = await $confirm('admin.delete_user_confirm', { user: user.email })
  if (!ret) { return }
  try {
    loading.value = true
    await fetch(`/user/${user.id}`, { method: 'DELETE' })
    $notify('admin.user_remove_ok')
    $emit('update')
  } catch (e) {
    const err = response.data.errors?.[0]?.message ?? e
    $notify(err, { color: 'error' })
    loading.value = false
  }
}

  async function toggle_to_notify (user) {
    user.to_notify = !user.to_notify
    await $fetch('/api/user', { method: 'PUT', body: user })
  }
  
  async function changeRole (user, role) {
    // ask confirmation?
    const ret = await $confirm('admin.change_role_confirm', { user: user.email, from_role: user.role, to_role: role })
    if (!ret) { return }
    try {
      await $fetch('/api/user', { method: 'PUT', body: ({ ...user, role })})
      user.role = role
    } catch (e) {
      console.error(e)
    }
    return false
  }
  
  async function createUser () {
    if (!userForm.value.validate()) { return }
    try {
      loading.value = true
      await $fetch('/api/user', { method: 'POST', body: newUser })
      newUser = { }
      $notify('admin.user_create_ok', Statuses.SUCCESS)
      refresh()
      loading.value = false
      newUserDialog.value = false
    } catch (e) {
      $notify(e?.statusMessage ?? e?.message ?? e, Statuses.ERROR)
      loading.value = false
    }
  }

</script>

<template>
  <v-container>
    <v-card-title>
      {{$t('common.users')}}
      <v-spacer />
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        outlined
        rounded
        :label="$t('common.search')"
        single-line
        hide-details
      />
    </v-card-title>

    <v-btn color="primary" text @click="newUserDialog = true" append-icon='mdi-plus'>
      {{$t('common.new_user')}}
    </v-btn> 

    <!-- ADD NEW USER -->
    <v-dialog v-model="newUserDialog" :fullscreen="$vuetify.display?.mobile">
      <v-card>
        <v-card-title>{{$t('common.new_user')}}</v-card-title>
        <v-card-text>
          <v-form v-model="valid" ref="userForm" lazy-validation @submit.prevent="createUser">
            <v-col>
              <v-text-field
                v-model="newUser.email"
                class="col-4"
                :label="$t('common.email')"
                :rules="$valid.email"
              />
            </v-col>
            <v-col>
              <v-select
                v-model="newUser.role"
                class="col-4"
                :label="$t('common.role')"
                :items="['admin', 'editor', 'user']"
              />
            </v-col>
            <v-text-field
              v-model="newUser.description"
              :label="$t('common.description')"
            />
          </v-form>
          <v-alert type="info" :closable="false" icon="mdi-information">{{$t('admin.user_add_help')}}</v-alert>
          <v-card-actions>
            <v-spacer/>
            <v-btn @click="newUserDialog=false" color="error" outlined>{{$t('common.cancel')}}</v-btn>
            <v-btn @click="createUser" :disabled="!valid" color="primary" outlined>{{$t('common.send')}}</v-btn>
          </v-card-actions>
        </v-card-text>
      </v-card> 
    </v-dialog>

    <v-card-text>
      <!-- USERS LIST -->
      <v-data-table
        :headers="headers"
        :items="users"
        :search="search"
        :hide-default-footer="users.length<5"
      >
        <template v-slot:item.is_active="{item}">
          <v-switch 
            :input-value="item.is_active" 
            readonly 
            @click.prevent="toggle(item)" 
            inset 
            hide-details
          />
        </template>
        <template v-slot:item.to_notify="{item}">
          <v-switch 
            v-if="item.role!=='user'" 
            :input-value="item.to_notify" 
            readonly 
            @click.prevent="toggle_to_notify(item)" 
            inset
            hide-details
          />
        </template>
        <template v-slot:item.role="{item}">
          <v-menu offset-y>
            <template v-slot:activator="{ props }">
              <v-btn 
                :color="roleColors[item.role]" 
                variant='outlined'
                v-bind="props" 
                append-icon='mdi-chevron-down'
                size='small'
                label
              >
                {{ item.role }}
              </v-btn>
            </template>
            <v-list width="100" nav>
              <v-list-item 
                v-for="role in ['admin', 'editor', 'user'].filter(r => r !== item.role)" 
                :key="role" 
                link 
                @click="changeRole(item, role)"
              >
                <v-list-item-title>{{ role }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
        <template #[`item.actions`]="{item}">
          <t-btn 
            color="error" 
            :tooltip="$t('admin.delete_user')"
            icon='mdi-delete-forever'
            @click="deleteUser(item)"
          />
        </template>
      </v-data-table>
    </v-card-text>
  </v-container>
</template>
