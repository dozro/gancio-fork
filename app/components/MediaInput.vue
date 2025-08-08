<script setup>
// const props = defineProps({
//   value: { type: Object, default: () => ({ image: null }) },
//   event: { type: Object, default: () => ({}) }
// })

const event = defineModel('event', { type: Object, required: true } )

const { $confirm } = useNuxtApp() 


const useUrl = ref(false)
const showPreview = ref(false)
const openMediaDetails = ref(false)
const imgUrlInput = ref(event?.value.media?.[0]?.url || '')
const name = event?.value.media?.[0]?.name || ''
const focalpoint = ref(event?.value.media?.[0]?.focalpoint || [0, 0])
const dragging = ref(false)

const mediaPreview = computed( () => {
  if (!event?.value.media?.[0]?.url && !event?.value.media?.[0]?.image) {
    return false
  }
  console.error(event.value?.media)
  const url = event?.value?.media?.[0]?.image
    ? URL.createObjectURL(event?.value?.media?.[0]?.image)
    : isValidUrl(event?.value?.media?.[0]?.url)
      ? event?.value?.media?.[0]?.url
      : `/media/thumb/${event?.value?.media?.[0]?.url}`

  return url
})

const left = computed(() => (focalpoint.value[0]+1) * 50 + '%')
const top = computed(() => (focalpoint.value[1]+1) * 50 + '%')

const savedPosition = computed(() => {
  const focalpoint = event?.value?.media?.[0]?.focalpoint || [0, 0]
  return `${(focalpoint[0] + 1) * 50}% ${(focalpoint[1] + 1) * 50}%`
})

const position = computed(() => {
  const fp = focalpoint?.value || [0, 0]
  return `${(fp[0] + 1) * 50}% ${(fp[1] + 1) * 50}%`
})

    function save () {
      event.value.media[0] = {
        ...event.value.media[0],
        focalpoint: focalpoint.value
      }
      // name: this.name || (this.event.title) || '',
      openMediaDetails.value = false
    }

    async function remove () {
      const ret = await $confirm('event.remove_media_confirmation')
      if (!ret) { return }
      useUrl.value = false
      imgUrlInput.value = ''
      event.value.media = []
    }

    function selectMedia (v) {
      event.value.media[0] = { image: v, name: event.title, focalpoint: [0, 0]}
    }

    function selectUrl () {
      if (validateUrl(imgUrlInput.value) === true) {
        event.value.media[0].url = imgUrlInput.value
      }
    }

    function handleStart (ev) {
      ev.preventDefault()
      dragging.value = true
      handleMove(ev, true)
      return false
    }

    function handleStop (ev) {
      dragging.value = false
    }

    function handleMove (ev, manual = false) {
      if (!dragging.value && !manual) return
      ev.stopPropagation()
      const boundingClientRect = document.getElementById('focalPointSelector').getBoundingClientRect()

      const clientX = ev.changedTouches ? ev.changedTouches[0].clientX : ev.clientX
      const clientY = ev.changedTouches ? ev.changedTouches[0].clientY : ev.clientY

      // // get relative coordinate
      let x = Math.ceil(clientX - boundingClientRect.left)
      let y = Math.ceil(clientY - boundingClientRect.top)

      // // snap to border
      x = x < 30 ? 0 : x > boundingClientRect.width - 30 ? boundingClientRect.width : x
      y = y < 30 ? 0 : y > boundingClientRect.height - 30 ? boundingClientRect.height : y

      // // map to real image coordinate
      const posY = -1 + (y / boundingClientRect.height) * 2
      const posX = -1 + (x / boundingClientRect.width) * 2

      focalpoint.value = [posX, posY]
      return false
    }

    function isValidUrl (url) {
      return /^https?:\/\/.+/i.test(url)
    }

    function validateUrl (value) {
      if (!value) return true // empty value is valid, since image is optional
      return isValidUrl(value) || t('validators.url')
    }
</script>
<template>
<span>
  <v-dialog v-model="openMediaDetails" :fullscreen="$vuetify.display?.mobile" width="1000px">
    <v-card>
      <v-toolbar :title="$t('common.media')" />
      <v-card-text>
        <v-row class="mt-1">
          <v-col
            id="focalPointSelector"
            @mousedown="handleStart"
            @touchstart="handleStart"
            @mousemove="handleMove"
            @touchmove="handleMove"
            @mouseup="handleStop"
            @touchend="handleStop"
          >
            <div class="focalPoint" :style="{ top, left }"></div>
            <img v-if="mediaPreview" :src="mediaPreview" />
          </v-col>
          <v-col cols='12' sm='4'>
            <p>{{ $t('event.choose_focal_point') }}</p>
            <!-- TODO: what if the URL preview goes wrong?
                 this could happen due to cors issues or a simply typo -->
            <img
              v-if="mediaPreview"
              class="mediaPreview d-none d-sm-block"
              :src="mediaPreview"
              :style="{ 'object-position': position }"
            />
            <v-textarea
              class="mt-4"
              type="text"
              label="Alternative text"
              persistent-hint
              filled
              :hint="$t('event.alt_text_description')"
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

  <h3 class="mb-3 font-weight-regular" v-if="mediaPreview">{{ $t('common.media') }}</h3>
  <v-card-actions v-if="mediaPreview">
    <v-switch
      class="ml-3 mt-0 pt-0"
      v-model="showPreview"
      inset
      :label="$t('common.show_preview')"
      hide-details
    />
    <v-spacer></v-spacer>
    <v-btn text color="primary" @click="openMediaDetails = true">{{ $t('common.edit') }}</v-btn>
    <v-btn text color="error" @click="remove">{{ $t('common.remove') }}</v-btn>
  </v-card-actions>

  <div class="w-100 pt-0" v-if="mediaPreview">
    <img class="w-100 pa-0" :src="mediaPreview" v-if="!showPreview" />
    <img class="w-100 mediaPreview pa-0" :src="mediaPreview" v-else :style="{ 'object-position': savedPosition }" />
    <!-- <span class="text-center">{{ event.media[0].name }}</span> -->
  </div>

  <div v-else>
    <v-text-field
      v-if="useUrl"
      :label="$t('common.url')"
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
      :label="$t('common.media')"
      :hint="$t('event.media_description')"
      prepend-icon="mdi-camera"
      @update:modelValue="selectMedia"
      persistent-hint
      variant="underlined"
      accept="image/*"
    />

    <v-switch v-model="useUrl" inset :label="$t('event.import_URL')"></v-switch>
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
