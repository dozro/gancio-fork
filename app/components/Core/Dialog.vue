<script setup>

const { $on, $emit } = useNuxtApp()
const { t } = useI18n()

onMounted ( () => {
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
  name.value = t(ev.label)
  visible.value = true
}

function result (value) {
  visible.value = false
  if (type.value === 'confirmDialog') {
    $emit('confirmDialog:result', value)
  } else {
    $emit('promptDialog:result', value && userInput.value )
    userInput.value = ''
  }
}

</script>
<template>
  <v-dialog v-model='visible'  width='400'>
    <v-card>
      <v-card-title class="bg-primary">{{title || $t('common.confirm')}}</v-card-title>
      <v-card-text>
        <div v-html='msg' />
        <v-textarea v-if='type === "promptDialog"' variant='underlined' :label='name' v-model='userInput' />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color='error' variant='outlined' class='mr-1' @click='result(false)'>{{$t("common.cancel")}}</v-btn>
        <v-btn color='primary' variant='outlined' @click='result(true)'>{{$t("common.ok")}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
