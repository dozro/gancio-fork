<script setup>
import get from 'lodash/get'

const props = defineProps({ users: { type: Array, default: () => [] } })

const search = ref('')
const newUserDialog = ref(false)
const changeRoleDialog = ref(false)
const roleColors = { admin: 'error', editor: 'warning', user: 'success' }
const valid = ref(false)
const loading = ref(false)
const userForm = ref()

const {  $confirm } = useNuxtApp()
const { t } = useI18n()
const newUser = reactive({
  email: '',
  is_admin: false
})

const headers = [
  { value: 'email', text: t('common.email'), width: 150 },
  { value: 'description', text: t('common.description') },
  { value: 'is_active', text: t('common.enabled'), width: 50 },
  { value: 'to_notify', text: t('admin.receive_confirm_notification'), width: 50 },
  { value: 'role', text: t('common.role'), width: 150 },
  // { value: 'is_editor', text: t('common.editor') },
  { value: 'actions', text: t('common.actions'), align: 'right', width: 100, sortable: false }
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
    const err = get(e, 'response.data.errors[0].message', e)
    $notify(t(err), { color: 'error' })
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
      newUser = { email: '', is_admin: false }
      $notify('admin.user_create_ok', { color: 'success' })
      $emit('update')
      loading.value = false
      newUserDialog.value = false
    } catch (e) {
      const err = get(e, 'response.data.errors[0].message', e)
      $notify(this.$t(err), { color: 'error' })
      loading.value = false
    }
  }

</script>

<template>
  <v-container>
    <v-card-title>
      {{$t('common.users')}}
      <v-spacer></v-spacer>
      <v-text-field
        v-model="search"
        append-icon="mdi-magnify"
        outlined
        rounded
        :label="$t('common.search')"
        single-line
        hide-details
      ></v-text-field>
    </v-card-title>

    <v-btn color="primary" text @click="newUserDialog = true" icon='mdi-plus'>
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
                class="col-4"
                v-model="newUser.email"
                :label="$t('common.email')"
                :rules="$validators.email"
              ></v-text-field>
            </v-col>
            <v-col>
              <v-select
                class="col-4"
                v-model="newUser.role"
                :label="$t('common.role')"
                :items="['admin', 'editor', 'user']"
              ></v-select>
            </v-col>
            <v-text-field
              v-model="newUser.description"
              :label="$t('common.description')"
            ></v-text-field>
          </v-form>
          <v-alert type="info" :closable="false" icon="mdi-information">{{$t('admin.user_add_help')}}</v-alert>
          <v-card-actions>
            <v-spacer></v-spacer>
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
            @click.native.prevent="toggle(item)" 
            inset 
            hide-details
          ></v-switch>
        </template>
        <template v-slot:item.to_notify="{item}">
          <v-switch 
            :input-value="item.to_notify" 
            v-if="item.role!=='user'" 
            readonly 
            @click.native.prevent="toggle_to_notify(item)" 
            inset
            hide-details
          ></v-switch>
        </template>
        <template v-slot:item.role="{item}">
          <v-menu offset-y>
            <template v-slot:activator="{ on, attrs }">
              <v-btn 
                :color="roleColors[item.role]" 
                outlined 
                v-bind="attrs" 
                v-on="on" 
                icon='mdi-chevron-down'
                small 
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
        <template v-slot:item.actions="{item}">
          <t-btn 
            @click="deleteUser(item)"
            color="error" 
            :tooltip="$t('admin.delete_user')"
            icon='mdi-delete-forever'
          />
        </template>
      </v-data-table>
    </v-card-text>
  </v-container>
</template>
