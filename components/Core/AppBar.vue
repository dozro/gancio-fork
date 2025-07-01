<script setup lang="ts">
const settings = useState<Settings>('settings')

</script>
<template>
  <nav id='AppBar'>
    <NavHeader />

    <!-- title -->
    <component :is='$route.name === "index" ? "h1" : "div"' class="text-center">
      <nuxt-link id="title" v-text="settings?.title ?? 'Gancio'" to="/" />
      <div
        class="text-body-1 font-weight-light pb-3"
        v-html="settings?.description ?? 'a shared agenda for local communities'"
      />
    </component>

    <NavSearch />
    <NavBar v-if="!['event-slug','e-slug'].includes($route?.name)"/> 
  </nav>
</template>
<style>
  nav.AppBar {
    background-image: linear-gradient(rgba(0,0,0,.8),hsla(0,0%,8%,.7)),url(/headerimage.png);
    background-position: center center;
    background-size: cover;
  }

  .v-theme--light nav.AppBar {
    background-image: linear-gradient(
        to bottom,
        rgba(230, 230, 230, 0.95),
        rgba(250, 250, 250, 0.95)
      ),
      url(/headerimage.png);
  }
  
  #title {
    word-break: break-all;
    font-size: 2rem;
    font-weight: 600;
    text-decoration: none;
  }
</style>
  