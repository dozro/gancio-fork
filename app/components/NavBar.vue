<script setup>
  const settings = useState('settings')
  const { loggedIn } = useUserSession()
</script>
<template>
  <v-tabs id='navbar' class='mt-4' align-tabs="center">
    <v-tab v-if='loggedIn || settings.allow_anon_event' to='/add'>
      <span class='d-none d-sm-flex'>{{$t('common.add_event')}}</span>
      <v-icon color='primary' icon='mdi-plus' />
    </v-tab>
    <v-tab to='/export'>
      <span class='d-none d-sm-flex'>{{$t('common.share')}}</span>
      <v-icon icon='mdi-share-variant' />
    </v-tab>
  </v-tabs>
  </template>
  