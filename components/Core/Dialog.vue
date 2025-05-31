<script setup>

const { $on, $emit } = useNuxtApp()
onMounted ( () => {
  $on('confirmDialog', confirmDialog)
  $on('promptDialog', promptDialog)
})
const type = ref('confirmDialog') // prompt

const msg = ref('')
const visible = ref(false)
const userInput = ref('')
const name = ref('')

function confirmDialog (ev) {
  type.value = 'confirmDialog'
  msg.value = ev.msg
  visible.value = true
}

function promptDialog (ev) {
  type.value = 'promptDialog'
  msg.value = ev.msg
  name.value = ev.name
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
  <v-dialog v-model='visible'  width='400' transition="dialog-top-transition">
    <v-card :title="$t('common.confirm')" color='warning' variant='flat'>
      <v-card-text>
        <div v-html='msg' />
        <v-text-field v-if='type === "promptDialog"' variant='outlined' :label='name' v-model='userInput' />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn color='error' class='mr-1' @click='result(false)'>{{$t("common.cancel")}}</v-btn>
        <v-btn color='primary' @click='result(true)'>{{$t("common.ok")}}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
