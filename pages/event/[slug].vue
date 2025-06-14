<!-- <script setup lang="ts">
import type { Event } from '#build/types/nitro-imports';

const route = useRoute()
const { data: event } = await useFetch<Event>(`/api/events/${route.params.slug}`)

if (!event) {
    throw createError({ status: 404, statusMessage: 'Event not found'})
}

const hasMedia = computed(() => event?.media?.length )

</script> -->
<!-- <template>
<v-container id="event" class="h-event pa-2 pa-sm-2 pt-0 pt-sm-0 container" itemscope itemtype="https://schema.org/Event">
    <v-card>
        <v-card-title class="strong p-name text--primary" itemprop="name">
            {{ event?.title }}
        </v-card-title>
        <v-row>
            <v-col class="col-12 col-md-8 pr-sm-2 pr-md-0">
                <CoreImg v-if="hasMedia" :event="event" />
                <div class="p-description text-body-1 pa-3 rounded" v-if="event?.description" itemprop="description" v-html="event.description"></div>
            </v-col>
            <v-col class="col-12 col-md-4">
                <EventDetail :event="event" />
            </v-col>
        </v-row>
    </v-card>
</v-container>
</template> -->

<script setup lang="ts">
// import { DateTime } from 'luxon'
import type { Event } from '#build/types/nitro-imports';

const settings = useState('settings')
const route = useRoute()
const { data: event } = useFetch<Event>(`/api/events/${route.params.slug}`)
console.error('sono qui e ', route.params.slug)
if (!event) {
    throw createError({ status: 404, statusMessage: 'Event not found'})
}

const hasMedia = computed(() => event?.media?.length )

// import clipboard from '../../assets/clipboard'
// import MyPicture from '~/components/MyPicture'
// import EventAdmin from '@/components/EventAdmin'
// import EventResource from '@/components/EventResource'
// import EmbedEvent from '@/components/embedEvent'
// import EventMapDialog from '@/components/EventMapDialog'
// import EventModeration from '@/components/EventModeration'
// EventAssignAuthor: () => import(/* webpackChunkName: "admin" */ '@/components/EventAssignAuthor'),

const showEmbed = ref(false)
const mapModal = ref(false)
const openModeration = ref(route.query?.moderation ? true : false)
const openAssignAuthor = ref(false)
      // mapModal: false,
      // openModeration: $route?.query?.moderation ? true : false,
      // openAssignAuthor: false,
      // reporting: false
  // head () {
  //   if (!this.event) {
  //     return {}
  //   }
  //   const tags_feed = this.event.tags && this.event.tags.map(tag => ({
  //     rel: 'alternate',
  //     type: 'application/rss+xml',
  //     title: `${this.settings.title} events tagged ${tag}`,
  //     href: this.settings.baseurl + `/feed/rss?tags=${tag}`
  //   }))
  //   const place_feed = {
  //     rel: 'alternate',
  //     type: 'application/rss+xml',
  //     title: `${this.settings.title} events  @${this.event?.place?.name}`,
  //     href: this.settings.baseurl + `/feed/rss?places=${this.event?.place?.id}`
  //   }

  //   return {
  //     title: `${this.settings.title} - ${this.event.title}`,
  //     meta: [
  //       // hid is used as unique identifier. Do not use `vmid` for it as it will not work
  //       {
  //         hid: 'description',
  //         name: 'description',
  //         content: this.plainDescription
  //       },
  //       {
  //         hid: 'og-description',
  //         name: 'og:description',
  //         content: this.plainDescription
  //       },
  //       { hid: 'og-title', property: 'og:title', content: this.event.title },
  //       {
  //         hid: 'og-url',
  //         property: 'og:url',
  //         content: `${this.settings.baseurl}/event/${this.event.slug || this.event.id}`
  //       },
  //       { property: 'og:type', content: 'event' },
  //       {
  //         property: 'og:image',
  //         content: this.$helper.mediaURL(this.event)
  //       },
  //       { property: 'og:site_name', content: this.settings.title },
  //       {
  //         property: 'og:updated_time',
  //         content: DateTime.fromSeconds(this.event.start_datetime, { zone: this.settings.instance_timezone }).toISO()
  //       },
  //       {
  //         property: 'article:published_time',
  //         content: DateTime.fromSeconds(this.event.start_datetime, { zone: this.settings.instance_timezone }).toISO()
  //       },
  //       { property: 'article:section', content: 'event' },
  //       { property: 'twitter:card', content: 'summary' },
  //       { property: 'twitter:title', content: this.event.title },
  //       {
  //         property: 'twitter:image',
  //         content: this.$helper.mediaURL(this.event)
  //       },
  //       {
  //         property: 'twitter:description',
  //         content: this.plainDescription
  //       }
  //     ],
  //     link: [
  //       { rel: 'image_src', href: this.$helper.mediaURL(this.event) },
  //       {
  //         rel: 'alternate',
  //         type: 'application/rss+xml',
  //         title: this.settings.title,
  //         href: this.settings.baseurl + '/feed/rss'
  //       },
  //       ...tags_feed,
  //       place_feed
  //     ]
  //   }
  // },
  // computed: {
  //   ...mapState(['settings']),
  //   hasOnlineLocations () {
  //     return this.event.online_locations && this.event.online_locations.length
  //   },
  //   showModeration () {
  //     return this.settings.enable_moderation && this.$auth?.user && (this.event.isMine || this.$auth?.user?.is_admin || this.$auth?.user?.is_editor)
  //   },
  //   showMap () {
  //     return this.settings.allow_geolocation && this.event.place?.latitude && this.event.place?.longitude
  //   },
  //   hasMedia () {
  //     return this.event.media && this.event.media.length
  //   },
  //   plainDescription () {
  //     return this.event.plain_description || ''
  //   },
  //   can_edit () {
  //     if (!this.$auth.user) {
  //       return false
  //     }
  //     return (
  //       this.event.isMine || this.$auth.user.is_admin || this.$auth.user.is_editor
  //     )
  //   },
  //   showResources () {
  //     return this.settings.enable_federation &&
  //     ( (!this.settings.hide_boosts && (this.event.boost?.length || this.event?.likes?.length)) ||
  //     ( this.settings.enable_resources && this.event?.resources?.length))      
  //   }
  // },
  // mounted () {
  //   window.addEventListener('keydown', this.keyDown)
  // },
  // beforeDestroy () {
  //   window.removeEventListener('keydown', this.keyDown)
  // },
  // methods: {
  // 
function report () {
      // this.reporting = true
      // const message = await this.$root.$prompt(this.$t('event.report_message_confirmation'), { title: this.$t('common.report') })
      // if (!message) {
      //   return
      // }
      // this.reporting = false
      // try {
      //   await this.$axios.$post(`/event/messages/${this.event.id}`, { message })
      //   this.$root.$message('common.sent', { color: 'success' })
      // } catch (e) {
      //   this.$root.$message(e, { color: 'warning' })
      // }
}
    
// function keyDown (ev) {
      // if (this.openModeration || this.reporting) {
      //   return
      // }
      // if (ev.altKey || ev.ctrlKey || ev.metaKey || ev.shiftKey) { return }
      // if (ev.key === 'ArrowRight' && this.event.next) {
      //   this.goNext()
      // }
      // if (ev.key === 'ArrowLeft' && this.event.prev) {
      //   this.goPrev()
      // }
// }

function goPrev () {
  // if (this.event.prev) {
  //   this.$router.replace(`/event/${this.event.prev}`)
  // }
}

function goNext () {
  //     if (this.event.next) {
  //       this.$router.replace(`/event/${this.event.next}`)
  //     }
  //   },
  //   copyLink () {
  //     this.$root.$message('common.copied', { color: 'success' })
  //   },
  // }
}

</script>
<template>
<div
  id="event"
  class="h-event pa-2 pa-sm-2 pt-0 pt-sm-0 container"
  v-touch="{ left: goNext, right: goPrev }"
  itemscope
  itemtype="https://schema.org/Event"
>
  <!-- EVENT PAGE -->
  <!-- gancio supports microformats (http://microformats.org/wiki/h-event) -->
  <!-- and microdata https://schema.org/Event -->
  <div class="title text-center text-md-h4 text-h5 pa-6">
    <strong class="p-name text--primary" itemprop="name">{{event.title}}</strong>
  </div>
  <v-row>
    <v-col class="col-12 col-md-8 pr-sm-2 pr-md-0">
      <MyPicture v-if="hasMedia" :event="event" />
      <div
        class="p-description text-body-1 pa-3 rounded"
        v-if="event.description"
        itemprop="description"
        v-html="event.description"
      />
    </v-col>
    <v-col class="col-12 col-md-4">
      <v-card outlined>
        <v-container class="eventDetails">
          <v-icon
            class="float-right"
            v-if="event.parentId"
            color="success"
            icon="mdi-repeat"
          />
            <!-- :datetime="$time.unixFormat(event.start_datetime, 'yyyy-MM-dd HH:mm')" -->
            <!-- :content="$time.unixFormat(event.start_datetime, 'yyyy-MM-dd\'T\'HH:mm')" -->
          <time
            class="dt-start"
            itemprop="startDate"
          >
            <v-icon icon="mdi-calendar" small />
            <!-- <span class="ml-2 text-uppercase">{{$time.when(event)}}</span> -->
            <div
              class="d-none dt-end"
              v-if="event.end_datetime"
              itemprop="endDate"
            >
              <!-- :content="$time.unixFormat(event.end_datetime,'yyyy-MM-dd\'T\'HH:mm')" -->
              <!-- {{$time.unixFormat(event.end_datetime,"yyyy-MM-dd'T'HH:mm")}} -->
            </div>
          </time>
          <div class="font-weight-light mb-3">
            <!-- {{$time.from(event.start_datetime)}} -->
            <!-- <small v-if="event.parentId">({{$time.recurrentDetail(event)}})</small> -->
          </div>
          <div
            class="p-location h-adr"
            itemprop="location"
            itemscope
            itemtype="https://schema.org/Place"
          >
            <v-icon icon="mdi-map-marker" small />
            <nuxt-link
              class="vcard ml-2 p-name text-decoration-none text-uppercase"
              :to="`/place/${encodeURIComponent(event?.place?.name)}`"
            >
              <span itemprop="name">{{event?.place?.name}}</span>
            </nuxt-link>
            <div
              class="font-weight-light p-street-address"
              v-if='event?.place?.name !=="online"'
              itemprop="address"
            >
              {{event?.place?.address}}
            </div>
          </div>
          <!-- <a class="d-block" v-if="event.ap_object?.url" :href="event.ap_object?.url">{{ event.ap_object?.url }}</a> -->
          <a v-if="event?.original_url" :href="event?.original_url">{{event.original_url}}</a>
        </v-container>
        <!-- tags, hashtags -->
        <v-container class="pt-0" v-if="event?.tags?.length">
          <v-chip
            class="p-category ml-1 mt-1"
            v-for="tag in event.tags"
            small
            label
            color="primary"
            outlined
            :key="tag"
            :to="`/tag/${encodeURIComponent(tag)}`"
          >
            {{tag}}
          </v-chip>
        </v-container>
        
        <!-- online events -->
        <v-list nav dense v-if="hasOnlineLocations">
          <v-list-item
            v-for="(item, index) in event.online_locations"
            target="_blank"
            :href="`${item}`"
            :key="index"
            prepend-icon='mdi-monitor-account'
            :title='item'
          />
        </v-list>
        
        <v-divider />
        <!-- info & actions -->
        <v-list dense nav color="transparent">
          
          <!-- copy link -->
          <v-list-item
            @click="clipboard(`${settings.baseurl}/event/${event.slug || event.id}`)"
            prepend-icon='mdi-content-copy'
            :title="$t('common.copy_link')"
          />

          <!-- map -->
          <v-list-item
            v-if="settings.allow_geolocation && event.place?.latitude && event.place?.longitude"
            @click="mapModal = true"
            prepend-icon='mdi-map'
            :title="$t('common.show_map')"
          />

          <!-- calendar -->
          <v-list-item
            :href="`/api/event/detail/${event.slug || event.id}.ics`"
            prepend-icon='mdi-calendar-export'
            :title="$t('common.add_to_calendar')"
          />

          <!-- Report -->
          <v-list-item
            v-if="settings.enable_moderation && settings.enable_report && !showModeration"
            @click="report"
            prepend-icon='mdi-message-text-outline'
            :title="$t('common.report')"
          />
          
          <!-- download flyer -->
          <v-list-item
            v-if="hasMedia && settings.show_download_media"
            :href="$helper.mediaURL(event, 'download')"
            prepend-icon='mdi-file-download-outline'
            :title="$t('event.download_flyer')"
          />
          
          <!-- embed -->
          <v-list-item @click="showEmbed = true" prepend-icon='mdi-code-tags' :title="$t('common.embed')" />
          
        </v-list>
        <!-- admin actions -->
        <template v-if="can_edit">
          <span>event admin</span>
          <!-- <EventAdmin
            :event="event"
            @openModeration="openModeration=true"
            @openAssignAuthor="thor=true"
          /> -->
        </template>
      </v-card>
    </v-col>
  </v-row>
  
  <!-- resources from fediverse -->
  <!-- <EventResource id="resources" class="mt-3" :event="event" v-if="showResources" /> -->
  
  <!-- Next/prev arrow -->
  <div class="text-center mt-5 mb-5">
    <v-btn
      class="mr-2"
      nuxt
      icon='mdi-arrow-left'
      outlined
      color="primary"
      :to="`/event/${event.prev}`"
      :disabled="!event.prev"
    />
    <v-btn nuxt bottom right outlined color="primary" :to="`/event/${event.next}`" :disabled="!event.next" icon='mdi-arrow-right' />
  </div>
  <v-dialog v-model="showEmbed" width="700px" :fullscreen="$vuetify.display?.mobile">
    <EmbedEvent :event="event" @close="showEmbed=false" />
  </v-dialog>
  <v-dialog
    v-show="settings.allow_geolocation && event.place?.latitude && event.place?.longitude"
    v-model="mapModal"
    :fullscreen="$vuetify.display?.mobile"
    destroy-on-close
  >
    <EventMapDialog :place="event.place" @close="mapModal=false" />
  </v-dialog>
  <v-dialog
    v-if="$auth?.user?.is_admin"
    v-model="openAssignAuthor"
    :fullscreen="$vuetify.display?.mobile"
    destroy-on-close
    width="400"
  >
    <EventAssignAuthor :event="event" @close="openAssignAuthor=false" />
  </v-dialog>
  <v-navigation-drawer
    v-model="openModeration"
    :fullscreen="$vuetify.display?.mobile"
    fixed
    top
    right
    width="400"
    temporary
  >
    <EventModeration
      :event="event"
      v-if="openModeration"
      @close="openModeration=false"
    />
  </v-navigation-drawer>
</div>
</template>
