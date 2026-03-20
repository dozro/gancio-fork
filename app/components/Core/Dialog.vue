<script setup>

const { $on, $emit } = useNuxtApp()
const { t } = useI18n()

const cancelBtn = useTemplateRef('cancelBtn')

onMounted (() => {
  $on('confirmDialog', confirmDialog)
  $on('promptDialog', promptDialog)
})
const type = ref('confirmDialog') // prompt

const msg = ref('')
const visible = ref(false)
const userInput = ref('')
const name = ref('')
const title = ref('')

function confirmDialog (ev) {
  type.value = 'confirmDialog'
  msg.value = t(ev.msg, ev.args)
  title.value = ''
  visible.value = true
}

function promptDialog (ev) {
  type.value = 'promptDialog'
  msg.value = t(ev.msg, ev.args)
  title.value = t(ev.title)
  name.value = ev?.label ? t(ev.label) : ''
  userInput.value = ev?.value ?? ''
  visible.value = true
}

function result (value) {
  visible.value = false
  if (type.value === 'confirmDialog') {
    $emit('confirmDialog:result', value)
  } else {
    $emit('promptDialog:result', value && userInput.value)
    userInput.value = ''
  }
}

watch(visible, () => {
  nextTick(() => {
    if (visible.value && cancelBtn.value && type.value === 'confirmDialog') {
      cancelBtn.value.$el.focus()
    }
  })
})

</script>
<template>
<v-dialog v-model='visible' max-width='550'>
  <v-card class="border-0">
    <v-card-title :class="{ 'bg-error': type === 'confirmDialog' }">{{title || $t('common.confirm')}}</v-card-title>
    <v-card-text>
      <div v-html='msg' />
      <v-textarea v-if='type === "promptDialog"' v-model='userInput' variant='underlined' :label='name' />
    </v-card-text>
    <v-card-actions>
      <v-btn ref="cancelBtn" variant='flat' @click='result(false)'>{{$t("common.cancel")}}</v-btn>
      <v-spacer />
      <v-btn :color="type === 'confirmDialog' ? 'error' : 'primary'" variant='outlined' @click='result(true)'>{{$t("common.ok")}}</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
</template>
