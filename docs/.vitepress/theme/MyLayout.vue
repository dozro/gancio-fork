<script setup>
import DefaultTheme from 'vitepress/theme'
import useSynchronizeThemes from './useSynchronizeThemes';

const { Layout } = DefaultTheme
useSynchronizeThemes()
</script>

<template>
  <v-app>
    <Layout />
  </v-app>
</template>
