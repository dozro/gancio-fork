<script setup lang='ts'>


const settings = useState('settings')
const { $notify, $confirm }  = useNuxtApp()

const headers = [
  { value: 'logo', title: 'Logo', width: 60, sortable: false },
  { value: 'name', title: 'Name' },
  { value: 'info', title: 'Info' },
  { value: 'url', title: 'URL' },
  { value: 'following', title: 'Following' },
  { value: 'follower', title: 'Follower' },
  { value: 'actions', title: 'Actions', align: 'right', sortable: false }
]


const { data: stats } = useFetch('/api/ap_actors/stats')
const { data: trusted_sources, refresh } = await useFetch('/api/ap_actors/trusted', { deep: true })

const source_url = ref('')
const instance_name = ref(settings.value.instance_name)
const trusted_sources_label = ref(settings.value.trusted_sources_label)
// const url2host = ref($options.filters.url2host)
const dialogAddTrustedSource = ref(false)
const statsRef = ref({})
const loading = ref(false)
const trusted_sources_ref = ref([])
const valid = ref(false)

function manageSetting(key) {
  return computed({
    get: () =>  settings.value[key],
    set: (value) => {
      $fetch('/api/settings', { method: 'PUT', body: { key, value } })
      settings.value[key] = value
    }
  })
}

const enable_resources = manageSetting('enable_resources')
const enable_federation = manageSetting('enable_federation')
const federated_events_in_home = manageSetting('federated_events_in_home')
const default_fedi_hashtags = manageSetting('default_fedi_hashtags')
const hide_boosts = manageSetting('hide_boosts')


async function toggleFollowing (trusted_source) {
  try {
    trusted_source.loading = true
    await $fetch('/api/ap_actors/follow', { method: 'PUT', body: { ap_id: trusted_source.ap_id } })
    $notify('common.ok', Statuses.SUCCESS)
  } catch (e) {
    $notify(String(e), Statuses.ERROR)
  }
  trusted_source.loading = false
  refresh()
}

async function createTrustedInstance () {
  // if (!this.$refs.form.validate()) { return }
  loading.value = true
  try {
    source_url.value = source_url.value.replace(/\/$/, '')
    await $fetch('/api/ap_actors/add_trust', { method: 'POST', body: { url: source_url.value } })
    refresh()
    // this.$refs.form.reset()
    dialogAddTrustedSource.value = false
    // this.$root.$emit('update_trusted_sources')
  } catch (e) {
    $notify(String(e), Statuses.ERROR)
  }
  loading.value = false
}

async function deleteTrustedSource (trusted_source) {
  const ret = await $confirm('admin.delete_trusted_source_confirm')
  if (!ret) { return }
  try {
    await $fetch('/api/ap_actors/trust', { method: 'DELETE', body: { ap_id: trusted_source.ap_id } })
    refresh()
    // this.$root.$emit('update_trusted_sources')
    $notify('admin.trusted_source_removed', Statuses.SUCCESS )
  } catch (e) {
    $notify(e, Statuses.ERROR)
  }
}
</script>

<template>
<v-container>
  <v-card-title>{{ $t('common.federation') }}</v-card-title>
  <v-card-text>

    <v-switch
      class="mt-0"
      v-model="enable_federation"
      :label="$t('admin.enable_federation')"
      persistent-hint
      :hint="$t('admin.enable_federation_help')"
    />

    <template v-if="enable_federation">
      <v-switch
        class="mt-4"
        v-model="federated_events_in_home"
        :label="$t('admin.federated_events_in_home')"
        :hint="$t('admin.federated_events_in_home_help')"
        persistent-hint
      />

      <v-switch
        class="mt-4"
        v-model="enable_resources"
        :label="$t('admin.enable_resources')"
        :hint="$t('admin.enable_resources_help')"
        persistent-hint
      />

      <v-switch
        class="mt-4"
        v-model="hide_boosts"
        :label="$t('admin.hide_boost_bookmark')"
        :hint="$t('admin.hide_boost_bookmark_help')"
        persistent-hint
      />

      <!--
      <v-text-field
        class="mt-5"
        v-model="instance_name"
        :label="$t('admin.instance_name')"
        :hint="`${$t('admin.instance_name_help')} ${instance_ap_url}`"
        placeholder="Instance name"
        persistent-hint
        @blur="save('instance_name', instance_name)"
      ></v-text-field>
      -->
    </template>

    <v-combobox
      class="mt-4"
      v-model="default_fedi_hashtags"
      prepend-icon="mdi-tag-multiple"
      :label="$t('admin.default_fedi_hashtags')"
      persistent-hint
      multiple
      :delimiters="[';', ',']"
      chips
      small-chips
      deletable-chips
      :hint="$t('admin.default_fedi_hashtags_help')"
      @blur="save('default_fedi_hashtags', default_fedi_hashtags)"
    >
      <template v-slot:selection="{ item, on, attrs, selected, parent }">
        <v-chip
          v-bind="attrs"
          closable
          @click:close="parent.selectItem(item)"
          :input-value="selected"
          label
          small
        >
          {{ item }}
        </v-chip>
      </template>
    </v-combobox>

    <v-text-field
      class="mt-4"
      v-model="trusted_sources_label"
      :label="$t('admin.trusted_sources_label')"
      persistent-hint
      :placeholder="$t('admin.trusted_sources_label_default')"
      :hint="$t('admin.trusted_sources_label_help')"
      @blur="save('trusted_sources_label', trusted_sources_label)"
    ></v-text-field>

    <v-dialog v-model="dialogAddTrustedSource" width="500px" :fullscreen="$vuetify.display?.mobile">
      <v-card>
        <v-card-title>{{ $t('admin.add_trusted_source') }}</v-card-title>
        <v-card-subtitle class="mt-2 text-wrap" v-html="$t('admin.add_trusted_source_help')"></v-card-subtitle>
        <v-card-text>
          <v-form v-model="valid" @submit.prevent="createTrustedInstance" ref="form" lazy-validation>
            <v-text-field
              class="mt-4"
              v-model="source_url"
              persistent-hint
              :rules="[$valid.required('common.url')]"
              :loading="loading"
              :hint="$t('admin.add_trusted_source')"
              :label="$t('common.url')"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant='outlined' color="error" @click="dialogAddTrustedSource=false">{{ $t('common.cancel') }}</v-btn>
          <v-btn
            variant='outlined'
            color="primary"
            :disabled="!valid || loading"
            :loading="loading"
            @click="createTrustedInstance"
          >{{ $t('common.ok') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-btn class="mt-4" @click="dialogAddTrustedSource = true" color="primary" text prepend-icon='mdi-plus'>
      {{ $t('admin.add_source') }}
    </v-btn>

    <v-data-table
      v-if="trusted_sources?.length"
      dense
      :hide-default-footer="trusted_sources?.length<10"
      :headers="headers"
      :items="trusted_sources"
    >
      <template v-slot:item.logo="{ item }">
        <v-img height="20" width="20" :src="item?.object?.icon?.url"></v-img>
      </template>
      <template v-slot:item.name="{ item }">
        <span>{{ item.object.name }}</span><br/>
        <span>
          @{{ item?.object?.preferredUsername ?? item?.instance?.data?.metadata?.nodeName }}@{{ item?.instance?.domain }}
        </span>
      </template>
      <template v-slot:item.info="{ item }">
        <span>{{ item?.object?.summary ?? item?.instance?.data?.metadata?.nodeDescription }}</span>
      </template>
      <template v-slot:item.url="{ item }">
        <a :href="item.object.url">{{ item.object.url }}</a>
      </template>
      <template v-slot:item.following="{ item }">
        <v-switch
          :input-value="item.following"
          :disabled="item.loading"
          :loading="item.loading"
          @change="() => toggleFollowing(item)"
          hide-details
        />
      </template>
      <template v-slot:item.follower="{ item }">
        <v-icon v-if="item.following" icon="mdi-download" />
        <v-icon v-if="item.follower" icon="mdi-upload" />
      </template>
      <template v-slot:item.actions="{ item }">
        <v-btn icon='mdi-delete-forever' @click="deleteTrustedSource(item)" color="error" />
      </template>
    </v-data-table>
  </v-card-text>
  <v-card-title>Stats</v-card-title>
  <v-card-text>
    <span>{{ $t('admin.stats', stats) }}</span>
  </v-card-text>
</v-container>

</template>
