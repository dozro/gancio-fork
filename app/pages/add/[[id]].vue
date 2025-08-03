<!-- Add / Edit event

 -->
<script setup>import { DateTime } from 'luxon'

const { loggedIn } = useUserSession()
const { $notify } = useNuxtApp()

const event = ref({ title: '', tags: [], place: {}, recurrent: null, media: [] })
const date = ref()
const valid = ref(false)
const edit = ref(false)
const loading = ref(false)
const form = ref()

const openImportDialog = ref(false)
const searchTag = ref('')

const { data: tags, status: statusTags } = await useFetch('/api/tags', { params: { query: searchTag } })

async function done() {
  const evt = event.value
  if (loading.value) {
    return
  }
  
  if (!form.value.validate()) {
    console.error('validation error!')
    return
  }
  
  loading.value = true

  const formData = new FormData()
  formData.append('recurrent', JSON.stringify(evt.date.recurrent))

  if (evt.media.length) {
    formData.append('image', evt.media[0].image)
    if (evt.media[0].url) {
      formData.append('image_url', evt.media[0].url)
    }
    formData.append('image_name', evt.media[0].name)
    formData.append('image_focalpoint', evt.media[0].focalpoint)
  }

  formData.append('title', evt.title)
  if (evt.place.id) {
    formData.append('place_id', evt.place.id)
  }
  formData.append('place_name', this.event.place.name.trim())
  formData.append('place_address', this.event.place.address || null)

  if (settings.value.allow_geolocation) {
    formData.append('place_latitude', evt.place.latitude || '')
    formData.append('place_longitude', evt.place.longitude || '')
  }

  if (evt.online_locations?.length) {
    evt.online_locations.forEach(l => formData.append('online_locations[]', l))
  }

  formData.append('description', evt.description)
  // formData.append('multidate', !!this.date.multidate)
  formData.append('start_datetime', evt.start_datetime)

  if (evt.end_datetime) {
    formData.append('end_datetime', evt.end_datetime)
  }

  // if (!!this.date.multidate) {
  //   formData.append('end_datetime', this.$time.fromDateInput(this.date.due, this.date.dueHour || '23:59'))
  // } else if (this.date.dueHour && this.date.due) {
    // formData.append('end_datetime', this.$time.fromDateInput(this.date.due, this.date.dueHour))
  // } else {
  //   formData.append('end_datetime', '')
  // }

  if (edit.value) {
    formData.append('id', evt.id)
  }

  if (evt.tags) { evt.tags.forEach(tag => formData.append('tags[]', tag?.tag ?? tag)) }
  
  // 
  try {
    const ret = await $fetch('/api/events', { method: edit.value ? 'PUT' : 'POST', body: formData })
    // navigate to created event in case its already visible and not a recurrent event!
    if (!evt?.recurrent && (ret.is_visible || loggedIn.value)) {
      navigateTo(`/event/${ret.slug}`)
    } else {
      navigateTo('/')
    }
    
    $notify(loggedIn.value ? (edit.value ? 'event.saved' : 'event.added') : 'event.added_anon', Statuses.SUCCESS)
  } catch (e) {
    console.error(e)
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
        <ImportDialog @close='openImportDialog = false' />
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
                <v-text-field v-model="event.title" prepend-icon='mdi-format-title' 
                  :label="$t('common.title')"
                  :rules="[$valid.required('common.title')]"
                  autofocus ref='title' />
              </v-col>

              <!-- Where -->
              <v-col cols=12>
                <WhereInput ref='where' v-model='event.place' :event='event' />
              </v-col>

              <!-- When -->
               <span>{{event.start_datetime}}</span>
              <DateInput ref="when" v-model:event="event" />
  
              <!-- Description -->
              <v-col class='px-0' cols='12'>
                <CoreEditor class='px-3 ma-0'
                  :label="$t('event.description_description')"
                  v-model='event.description'
                  :placeholder="$t('event.description_description')"
                  max-height='400px' />
              </v-col>
  
              <!-- MEDIA / FLYER / POSTER -->
              <v-col cols=12 md=6>
                <MediaInput v-model:event='event' />
              </v-col>

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
