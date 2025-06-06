<script setup>
// import clipboard from '../assets/clipboard'

const { data: events } = await useFetch('/api/events')
const settings = useState('settings')

const type = ref('rss')
const list = reactive({
  title: settings.title,
  maxEvents: null,
  theme: 'dark',
  sidebar: 'true'
})

const filters = reactive({ tags: [], places: [], collection: undefined, show_recurrent: settings.recurrent_event_visible })


const code = computed(() => {
  const params = [`baseurl="${settings.baseurl}"`]

  if (list.title && list.sidebar === 'true') {
    params.push(`title="${list.title}"`)
  }

  if (filters.collection) {
    params.push(`collection="${filters.collection}"`)
  } else {
    if (filters.places.length) {
      params.push(`places="${filters.places.join(',')}"`)
    }

    if (filters.tags.length) {
      params.push(`tags="${filters.tags.join(',')}"`)
    }
  }

  if (filters.show_recurrent) {
    params.push(`show_recurrent="${filters.show_recurrent}"`)
  }

  if (list.maxEvents) {
    params.push('maxlength=' + list.maxEvents)
  }

  params.push('sidebar="' + list.sidebar + '"')
  params.push(`theme="${list.theme}"`)

  return `<script src="${settings.baseurl}/gancio-events.es.js"><\/script>\n<gancio-events ${params.join(' ')}></gancio-events>\n\n`
})

const link = computed(() => {
  const typeMap = ['rss', 'ics']
  const params = []


  if (filters.collection) {
    return `${settings.baseurl}/feed/${typeMap[type]}/collection/${encodeURIComponent(filters.collection)}`
  } else {
    if (filters.tags.length) {
      params.push(`tags=${filters.tags.map(encodeURIComponent).join(',')}`)
    }

    if (filters.places.length) {
      params.push(`places=${filters.places.join(',')}`)
    }
  }

  if (filters.show_recurrent) {
    params.push('show_recurrent=true')
  }

  return `${settings.baseurl}/feed/${typeMap[type]}${params.length ? '?' : ''}${params.join('&')}`
})

</script>

<template>
<v-container class='pa-0 pa-md-3'>
  <v-card>
    <v-card-title> {{$t('common.share')}}</v-card-title>
    <v-card-text>
      <p class='text-body-1'> {{$t('export.intro')}}</p>
      <v-card variant='outlined' :dark='is_dark' :color="is_dark ? '#333' : '#ececec'">
        <v-card-title> {{$t('export.filter_title')}}</v-card-title>
        <v-card-subtitle> {{$t('export.filter_description')}}</v-card-subtitle>
        <v-card-text>
          <Search v-model='filters' />
        </v-card-text>
      </v-card>
    </v-card-text>
    <v-tabs v-model='type' show-arrows :next-icon='mdi-chevron-right' :prev-icon='mdi-chevron-left'>

      <!-- //- TOFIX
      //- v-tab {{$t('common.email')}}
      //- v-tab-item
        v-card
          v-card-text
            p(v-html='$t(`export.email_description`)')
            v-switch.mt-0(inset :label="$t('notify_on_insert')")
            v-switch.mt-0(inset :label="$t('morning_notification')")
            v-text-field(v-model='notification.email' :placeholder="$t('export.insert_your_address')" ref='email')
              v-btn(slot='prepend' text color='primary' @click='add_notification') {{$t('common.send')}} <v-icon>mdi-email</v-icon> -->

      <v-tab> {{$t('common.feed')}}</v-tab>
      <v-tab-item>
        <v-card>
          <v-card-text>
            <p v-html='$t(`export.feed_description`)' />
            <v-text-field v-model="link" readonly>
              <template #prepend>
                <v-btn text color="primary" @click="clipboard(link)" append-icon='mdi-content-copy'>
                  {{$t("common.copy")}}
                </v-btn>
              </template>
            </v-text-field>
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab> {{$t('export.ical_title')}}</v-tab>
      <v-tab-item>
        <v-card>
          <v-card-text>
            <p v-html='$t(`export.ical_description`)' />
            <v-text-field v-model="link">
              <template #prepend>
                <v-btn text color="primary" @click="clipboard(link)" append-icon='mdi-content-copy'>
                  {{$t("common.copy")}}
                </v-btn>
              </template>
            </v-text-field>
          </v-card-text>
        </v-card>
      </v-tab-item>

      <v-tab> {{$t('export.list_title')}}</v-tab>
      <v-tab-item>
        <v-card>
          <v-card-text>
            <p v-html='$t(`export.list_description`)' />

            <v-row>
              <v-col class="col-12 col-lg-4">
                <v-text-field v-model="list.title" :label="$t('common.title')"></v-text-field>
                <v-text-field v-model="list.maxEvents" type="number" min="1" :label="$t('common.max_events')"></v-text-field>
                <v-switch v-model="list.theme" hide-details inset :true-value="'dark'" :false-value="'light'" :label="$t('admin.is_dark')"></v-switch>
                <v-switch v-model="list.sidebar" inset :true-value="'true'" :false-value="'false'" :label="$t('admin.widget')"></v-switch>
              </v-col>
              <v-col class='col-12.col-lg-8'>
                <gancio-events
                  :baseurl='settings.baseurl'
                  :maxlength='list.maxEvents &&  Number(list.maxEvents)'
                  :title='list.title'
                  :theme='list.theme'
                  :collection='filters.collection'
                  :places='filters.places.join(",")'
                  :tags='filters.tags.join(",")'
                  :show_recurrent='filters.show_recurrent'
                  :sidebar="list.sidebar" />
              </v-col>
            </v-row>
            <v-alert class="pa-5 my-4 blue-grey darken-4 text-body-1 lime--text text--lighten-3">
              <pre>{{code}}</pre>
              <v-btn class="float-end" variant='text' append-icon='mdi-content-copy' color="primary" @click="clipboard(code)">
                {{$t("common.copy")}}
              </v-btn>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-tab-item>
      <v-tab v-if='settings.enable_federation'> {{$t('common.fediverse')}}</v-tab>
      <v-tab-item v-if='settings.enable_federation' />
        <FollowMe />
        <!-- //- TOFIX
        //- v-tab.pt-1(label='calendar' name='calendar')
        //- v-tab-item
        //-   p(v-html='$t(`export.calendar_description`)')
        //-   //- no-ssr
        //-     Calendar.mb-1
        //-   v-text-field.mb-1(type='textarea' v-model='script')
        //-   el-button.float-right(plain type="primary" icon='el-icon-document') Copy -->
    </v-tabs>
  </v-card>
</v-container>
</template>
