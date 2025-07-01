<!-- Add / Edit event

 -->
<script setup>
import { Statuses } from "~/types/settings"
const { loggedIn } = useUserSession()
const { $notify } = useNuxtApp()

const event = ref({ title: '', tags: [], place: {}, recurrent: null })
const date = ref()
const valid = ref(false)
const edit = ref(false)
const loading = ref(false)
const form = ref()

const openImportDialog = ref(false)
const searchTag = ref('')

const { data: tags, status: statusTags } = await useFetch('/api/tags', { params: { query: searchTag } })

async function done() {
  if (loading.value) {
    return
  }
  
  if (!form.value.validate()) {
    console.error('validation error!')
    return
  }
  
  loading.value = true

  const formData = new FormData()
  // formData.append('recurrent', JSON.stringify(this.date.recurrent))

  // if (this.event.media.length) {
  //   formData.append('image', this.event.media[0].image)
  //   if (this.event.media[0].url) {
  //     formData.append('image_url', this.event.media[0].url)
  //   }
  //   formData.append('image_name', this.event.media[0].name)
  //   formData.append('image_focalpoint', this.event.media[0].focalpoint)
  // }

  formData.append('title', event.value.title)
  if (event.value.place.id) {
    formData.append('place_id', event.value.place.id)
  }
  // formData.append('place_name', this.event.place.name.trim())
  // formData.append('place_address', this.event.place.address || null)

  // if (this.settings.allow_geolocation) {
  //   formData.append('place_latitude', this.event.place.latitude || '')
  //   formData.append('place_longitude', this.event.place.longitude || '')
  // }

  // if (this.event.online_locations?.length) {
  //   this.event.online_locations.forEach(l => formData.append('online_locations[]', l))
  // } else {
  //   formData.append('online_locations', [])
  // }

  // formData.append('description', this.event.description)
  // formData.append('multidate', !!this.date.multidate)
  formData.append('start_datetime', event.value.start_datetime ? Math.floor(new Date(event.value.start_datetime).getTime() / 1000) : '') // this.$time.fromDateInput(this.date.from, this.date.fromHour))
  // if (!!this.date.multidate) {
  //   formData.append('end_datetime', this.$time.fromDateInput(this.date.due, this.date.dueHour || '23:59'))
  // } else if (this.date.dueHour && this.date.due) {
  //   formData.append('end_datetime', this.$time.fromDateInput(this.date.due, this.date.dueHour))
  // } else {
  //   formData.append('end_datetime', '')
  // }

  // if (this.edit) {
  //   formData.append('id', this.event.id)
  // }

  if (event.value.tags) { event.value.tags.forEach(tag => formData.append('tags[]', tag?.tag ?? tag)) }
  
  // 
  try {
    const ret = await $fetch('/api/events', { method: edit.value ? 'PUT' : 'POST', body: formData })
    console.error(event.value)
    console.error('recurrent', !event.value?.recurrent, 'is_visible', ret.is_visible, 'logged' , loggedIn.value)
    // navigate to created event in case its already visible and not a recurrent event!
    if (!event.value?.recurrent && (ret.is_visible || loggedIn.value)) {
      console.error('dovrei essere qui!')
      navigateTo(`/event/${ret.slug}`)
    } else {
      console.error('e invece sono qui?!?!?')
      navigateTo('/')
    }
    
    $notify(loggedIn.value ? (edit.value ? 'event.saved' : 'event.added') : 'event.added_anon', Statuses.SUCCESS)
  } catch (e) {
    switch (e?.request?.status) {
      case 413:
        $notify('event.image_too_big', Statuses.ERROR)
        break
      default:
        $notify(e?.response?.data ?? e, Statuses.ERROR)
    }
  }
  loading.value = false
}

</script>
<template>
  <v-container class="pa-0 pa-md-3">
    <v-card>
      <v-card-title>
        <v-btn variant='outlined' class='float-right' color='primary' @click='openImportDialog = true' prepend-icon="mdi-file-import">{{$t('common.import') }}</v-btn>
        <h4>{{ edit ? $t('common.edit_event') : $t('common.add_event') }}</h4>
      </v-card-title>
      <v-dialog v-model='openImportDialog' :fullscreen='$vuetify.display.mobile'>
        <!-- <ImportDialog(@close='openImportDialog = false' @imported='eventImported') -->
      </v-dialog>
      <v-card-text class='px-0 px-xs-2'>
        <v-form v-model='valid' ref='form'>
          <v-container>
            <v-row>
              <!-- Not logged event -->
              <v-col v-if='!loggedIn' cols=12>
                <p v-html="$t('event.anon_description')" />
              </v-col>

              <!-- Title -->
              <v-col cols=12>
                <!-- @change='v => event?.title = v'
                :value = 'event?.title' -->
                <v-text-field v-model="event.title" prepend-icon='mdi-format-title' 
                  :label="$t('common.title')"
                  :rules="[$valid.required('common.title')]"
                  autofocus ref='title' />
              </v-col>

              <!-- Where -->
              <v-col cols=12>
                <span>MODEL: {{event.place}} -</span>
                <WhereInput ref='where' v-model='event.place' :event='event' />
              </v-col>

              <!-- When -->
              <span>MODEL: {{event.start_datetime}} - {{ event.end_datetime }}</span>
              <DateInput ref="when" v-model:event="event" />

              <!-- TAGS -->
              <v-col cols=12 md=6>
                <span>{{ tags }} - {{ searchTag }} - {{ statusTags }}</span>
                <v-combobox
                  v-model:search="searchTag" v-model="event.tags" prepend-icon="mdi-tag-multiple" chips
                  multiple closable-chips hide-no-data hide-selected persistent-hint
                  :loading="statusTags === 'pending'" :delimiters="[',', ';']" :items="tags || []"
                  :menu-props="{ maxWidth: 400, eager: true }" :label="$t('common.tags')">
                  <!-- <template v-slot:selection="{ item, on, attrs, selected, parent }">
                    <v-chip v-bind="attrs" close :close-icon='mdiCloseCircle' @click:close='parent.selectItem(item)'
                      :input-value="selected" label small>{{ item }}</v-chip>
                  </template> -->
                </v-combobox>
              </v-col>


            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :loading='loading' :disabled='!valid || loading' variant='outlined' color='primary' @click='done'>{{ edit ?
          $t('common.save') : $t('common.send') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>
