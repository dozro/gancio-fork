<!-- Add / Edit event

 -->
<script setup lang="ts">

const { loggedIn } = useUserSession()
const { $notify } = useNuxtApp()
const settings = useState<Settings>('settings')

const { t } = useI18n()
useHead({ title: `${settings.value.title} - ${t('common.add_event')}` })

const route = useRoute()

const event = ref<EventAPI>({
  title: '',
  start_datetime: 0,
  description: '',
  media: [{}],
  place: {}
})

let eventId = route.params.eventId
if (eventId) {
  const { data , error } = await useFetch<EventAPI>(() => `/api/event/detail/${route.params.eventId}`)
  if (error.value) {
    throw createError(error.value)
  }
  if (!data.value) {
    throw createError({ status: 404, statusMessage: 'Event not found' })
  } else {
    if (route.query.clone === 'true') {
      eventId = undefined
    }
    event.value = data.value
  }
}

const valid = ref(false)
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
  // formData.append('recurrent', JSON.stringify(evt.date.recurrent))

  if (evt?.media?.[0]) {
    const media: Media = evt.media[0]
    if (media?.image) {
      formData.append('image', media.image)
    }

    if (media?.url) {
      formData.append('image_url', media.url)
    }

    if (media?.name) {
      formData.append('image_name', media.name)
    }

    if (media?.focalpoint) {
      formData.append('image_focalpoint', JSON.stringify(media.focalpoint))
    }
  }

  formData.append('title', evt.title)
  if (evt?.place?.id) {
    formData.append('place_id', String(evt.place?.id))
  }
  formData.append('place_name', evt.place?.name.trim())
  formData.append('place_address', evt.place?.address || null)

  if (settings.value.allow_geolocation) {
    formData.append('place_latitude', String(evt?.place?.latitude ?? ''))
    formData.append('place_longitude', String(evt?.place?.longitude ?? ''))
  }

  if (evt.online_locations?.length) {
    evt.online_locations.forEach((l: string) => formData.append('online_locations[]', l))
  }

  formData.append('description', evt.description)
  // formData.append('multidate', !!this.date.multidate)
  formData.append('start_datetime', evt.start_datetime)

  if (evt.end_datetime) {
    formData.append('end_datetime', evt.end_datetime)
  }

  if (normalizedTags?.value?.length) {
    normalizedTags.value?.forEach(tag => formData.append('tags[]', tag))
  } else {
    formData.append('tags[]', '')
  }

  // 
  try {
    const ret: EventAPI = eventId ?
      await $fetch(`/api/events/${eventId}`, { method: 'PUT', body: formData }) :
      await $fetch('/api/events', { method: 'POST', body: formData })

    // navigate to created event in case its already visible and not a recurrent event!
    if (!evt?.recurrent && (ret.is_visible || loggedIn.value)) {
      navigateTo(`/event/${ret.slug}`)
    } else {
      navigateTo('/')
    }

    $notify(loggedIn.value ? (eventId ? 'event.saved' : 'event.added') : 'event.added_anon', Statuses.SUCCESS)
  } catch (e) {
    switch (e?.request?.status) {
      case 413:
        $notify('event.image_too_big', Statuses.ERROR)
        break
      default:
        $notify(e, Statuses.ERROR)
    }
  }
  loading.value = false
}
const normalizedTags = computed({
  get: () => event?.value?.tags,
  set: (newTags: [string]) => {
    const seen = new Set()
    const tags = []
    for (const tag of newTags) {
      const norm = tag.toLocaleLowerCase()
      if (!seen.has(norm)) {
        seen.add(norm)
        tags.push(tag)
      }
    }
    event.value = { ...event.value, tags }
  }
})

</script>
<template>
  <v-container class="pa-0 pa-md-3">
    <v-card>
      <v-card-title>
        <!-- <v-btn variant='outlined' class='float-right' color='primary' @click='openImportDialog = true' prepend-icon="mdi-file-import">{{$t('common.import') }}</v-btn> -->
        <h4>{{ eventId ? $t('common.edit_event') : $t('common.add_event') }}</h4>
      </v-card-title>
      <!-- <v-dialog v-model='openImportDialog' :fullscreen='$vuetify.display.mobile'>
        <ImportDialog @close='openImportDialog = false' />
      </v-dialog> -->
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
                <v-text-field v-model="event.title" prepend-icon='mdi-format-title' :label="$t('common.title')"
                  :rules="[$valid.required('common.title')]" autofocus ref='title' />
              </v-col>

              <!-- Where -->
              <v-col cols=12>
                <WhereInput ref='where' v-model='event.place' :event='event' />
              </v-col>

              <!-- When -->
              <DateInput ref="when" v-model:event="event" />

              <!-- Description -->
              <v-col class='px-0' cols='12'>
                <CoreEditor class='px-3 ma-0' :label="$t('event.description_description')" v-model='event.description'
                  :placeholder="$t('event.description_description')" max-height='400px' />
              </v-col>

              <!-- MEDIA / FLYER / POSTER -->
              <v-col cols=12 md=6>
                <MediaInput v-model:media='event.media' :event='event' />
              </v-col>

              <!-- TAGS -->
              <v-col cols=12 md=6>
                <v-combobox v-model:search="searchTag" v-model="normalizedTags" prepend-icon="mdi-tag-multiple" chips
                  multiple closable-chips hide-no-data hide-selected persistent-hint :loading="statusTags === 'pending'"
                  :delimiters="[',', ';']" :items="tags || []"
                  :label="$t('common.tags')">
                </v-combobox>
              </v-col>


            </v-row>
          </v-container>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :loading='loading' :disabled='!valid || loading' variant='outlined' color='primary' @click='done'>{{
          eventId ?
            $t('common.save') : $t('common.send') }}</v-btn>
      </v-card-actions> </v-card>
  </v-container>
</template>
