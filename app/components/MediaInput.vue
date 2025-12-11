<script setup lang="ts">
const { t } = useI18n()
const props = defineProps<{event: EventAPI}>()
const media = defineModel<Media[]>('media', { required: true, default: () => [] })

const { $confirm } = useNuxtApp()

const useUrl = ref(false)
const showPreview = ref(false)
const openMediaDetails = ref(false)
const firstMedia = media?.value?.[0]
const name = ref(firstMedia?.name ?? '')
const imgUrlInput = ref(firstMedia?.url ?? '')

const focalpoint = ref<[number, number]>(firstMedia?.focalpoint ?? [0, 0])
const dragging = ref(false)
const mediaPreview = computed( () => {
  if (!media.value[0]?.url && !media.value[0]?.image) {
    return false
  }

  const url = media.value[0]?.image
    ? URL.createObjectURL(media.value[0]?.image)
    : isValidUrl(media.value[0]?.url)
      ? media.value[0]?.url
      : `/media/thumb/${media.value[0]?.url}`

  return url
})

const left = computed(() => (focalpoint?.value?.[0] +1) * 50 + '%')
const top = computed(() => (focalpoint?.value?.[1]+1) * 50 + '%')

const savedPosition = computed(() => {
  const focalpoint = media.value[0]?.focalpoint || [0, 0]
  return `${(focalpoint[0] + 1) * 50}% ${(focalpoint[1] + 1) * 50}%`
})

const position = computed(() => {
  const fp = focalpoint?.value ?? [0, 0]
  return `${(fp?.[0] + 1) * 50}% ${(fp[1] + 1) * 50}%`
})

function save () {
  media.value ??= []
  media.value[0] ??= {} as Media
  media.value[0].focalpoint = focalpoint.value
  media.value[0].name = name.value || props.event.title

  // name: this.name || (this.event.title) || '',
  openMediaDetails.value = false
}
async function remove () {
  const ret = await $confirm('event.remove_media_confirmation')
  if (!ret) { return }
  useUrl.value = false
  imgUrlInput.value = ''
  media.value = []
}

function selectMedia (v: File | File[]) {

  media.value ??= []
  media.value[0] ??= {} as Media
  media.value[0] = { image: v as File, name: props.event.title, focalpoint: [0, 0]}
}

function selectUrl () {

  media.value ??= []
  media.value[0] ??= {} as Media

  if (validateUrl(imgUrlInput.value) === true) {
    media.value[0].url = imgUrlInput.value
  }

}
function handleStart (ev: PointerEvent) {
  ev.preventDefault()
  dragging.value = true
  handleMove(ev, true)
  return false
}

function handleStop () {
  dragging.value = false
}

function handleMove (ev: PointerEvent, manual = false) {
  if (!dragging.value && !manual) return
  ev.stopPropagation()
  const el = document.getElementById('focalPointSelector')
  if (!el) return
  const boundingClientRect = el.getBoundingClientRect()

  // get relative coordinate
  let x = Math.ceil(ev.clientX - boundingClientRect.left)
  let y = Math.ceil(ev.clientY - boundingClientRect.top)

  // snap to border
  x = x < 30 ? 0 : x > boundingClientRect.width - 30 ? boundingClientRect.width : x
  y = y < 30 ? 0 : y > boundingClientRect.height - 30 ? boundingClientRect.height : y

  // map to real image coordinate
  const posY = -1 + (y / boundingClientRect.height) * 2
  const posX = -1 + (x / boundingClientRect.width) * 2

  focalpoint.value = [posX, posY]
}

function isValidUrl (url?: string) {
  return /^https?:\/\/.+/i.test(url ?? '')
}

function validateUrl (value: string) {
  if (!value) return true // empty value is valid, since image is optional
  return isValidUrl(value) || t('validators.url')
}
</script>
<template>
<span>
  <!-- this dialog allows to choose a focal point -->
  <v-dialog v-model="openMediaDetails" :fullscreen="$vuetify.display?.mobile" width="1000px">
    <v-card>
      <span>{{focalpoint[0]}}</span>
      <v-card-text>
        <v-row class="mt-1">
          <v-col
            id="focalPointSelector"
            @pointerdown="handleStart"
            @pointermove="handleMove"
            @pointerup="handleStop"
          >
            <div class="focalPoint" :style="{ top, left }"></div>
            <img v-if="mediaPreview" :src="mediaPreview" />
          </v-col>
          <v-col cols='12' sm='4'>
            <p>{{ t('event.choose_focal_point') }}</p>
            <!-- TODO: what if the URL preview goes wrong?
                 this could happen due to cors issues or a simply typo -->
            <img
              v-if="mediaPreview"
              class="mediaPreview d-none d-sm-block"
              :src="mediaPreview"
              :style="{ 'object-position': position }"
            />
            <v-textarea
              v-model='name'
              class="mt-4"
              type="text"
              label="Alternative text"
              persistent-hint
              filled
              :hint="t('event.alt_text_description')"
            />
            <br />
            <v-card-actions class="justify-space-between">
              <v-btn text @click="openMediaDetails = false" color="warning">Cancel</v-btn>
              <v-btn text color="primary" @click="save">Save</v-btn>
            </v-card-actions>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>

  <h3 class="mb-3 font-weight-regular" v-if="mediaPreview">{{ t('common.media') }}</h3>
  <v-card-actions v-if="mediaPreview">
    <v-switch
      class="ml-3 mt-0 pt-0"
      v-model="showPreview"
      :label="t('common.show_preview')"
      hide-details
    />
    <v-spacer></v-spacer>
    <v-btn text color="primary" @click="openMediaDetails = true">{{ t('common.edit') }}</v-btn>
    <v-btn text color="error" @click="remove">{{ t('common.remove') }}</v-btn>
  </v-card-actions>

  <div class="w-100 pt-0" v-if="mediaPreview">
    <img class="w-100 pa-0" :src="mediaPreview" v-if="!showPreview" />
    <img class="w-100 mediaPreview pa-0" :src="mediaPreview" v-else :style="{ 'object-position': savedPosition }" />
    <span class="text-center">{{ media?.[0].name }}</span>
  </div>

  <div v-else>
    <v-text-field
      v-if="useUrl"
      :label="t('common.url')"
      :hint="'https://example.com/image.jpg'"
      prepend-icon="mdi-camera"
      persistent-hint
      type="url"
      v-model="imgUrlInput"
      @change="selectUrl"
      placeholder="https://example.com/image.jpg"
      :rules="[validateUrl]"
    />

    <v-file-input
      v-else
      :label="t('common.media')"
      :hint="t('event.media_description')"
      prepend-icon="mdi-camera"
      @update:modelValue="selectMedia"
      persistent-hint
      variant="underlined"
      accept="image/*"
    />

    <v-switch v-model="useUrl" :label="t('event.import_URL')" />
  </div>
</span>

</template>

<style>
.cursorPointer {
  cursor: crosshair;
}

.mediaPreview {
  width: 100%;
  object-fit: cover;
  object-position: top;
  aspect-ratio: 1.7778;
}

#focalPointSelector {
  position: relative;
  cursor: move;
  overflow: hidden;
  display: flex;
  height: 100%;
  justify-self: center;
  align-items: center;
}

#focalPointSelector img {
  width: 100%;
}

.focalPoint {
  position: absolute;
  width: 50px;
  height: 50px;
  top: 100px;
  left: 100px;
  transform: translate(-25px, -25px);
  border-radius: 50%;
  border: 1px solid #ff6d408e;
  box-shadow: 0 0 0 9999em rgba(0, 0, 0, .65);
}
</style>
