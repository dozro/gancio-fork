<script setup lang='ts'>
const props = defineProps<{ user: User }>()
const open = defineModel<boolean>('modelValue')
const valid = ref<boolean>()

const emit = defineEmits<{
  'update': [value: User]
  'update:modelValue': []
}>()
</script>
<template>
<!-- Edit USER -->
<v-dialog v-model="open" :fullscreen="$vuetify.display?.mobile">
  <v-card>
    <v-card-title class="bg-primary">{{$t('common.edit_user')}}</v-card-title>
    <v-card-text>
      <v-form ref="userForm" v-model="valid" validate-on='lazy' @submit.prevent="$emit('update', user)">
        <v-text-field
          v-model="user.password"
          type='password'
          :label="$t('common.password')"

          :rules='[$valid.password]'
        />
        <v-select
          v-model="user.role"
          class="col-4"
          :label="$t('common.role')"
          :items="['admin', 'editor', 'user']"
        />
        <v-text-field
          v-model="user.description"
          :label="$t('common.description')"
        />
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer/>
      <v-btn color="error" variant='outlined' @click="$emit('update:modelValue', false)">{{$t('common.cancel')}}</v-btn>
      <v-btn :disabled="!valid" color="primary" variant='outlined' type='submit'>{{$t('common.save')}}</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

</template>
