<script setup lang="ts">
import { withBase } from 'vitepress'
import { data as posts } from '../data/posts.data'

</script>

<template>
<div class="blog-list">
  <article v-for="post in posts" :key="post.url">
    <h2><a :href="withBase(post.url)">{{ post.title }}</a></h2>
    <p class="meta">{{ post.date }} – {{ post.author }}</p>
    <p>{{ post.excerpt }}</p>
  </article>
</div>
</template>

<style scoped>
.blog-list article { margin-bottom: 2rem; }
.meta { color: var(--vp-c-text-2); font-size: .875rem; }
</style>