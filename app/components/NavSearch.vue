<script setup lang="ts">
import time from '~/utils/time'
const settings = useState<Settings>('settings')
const selectedDate = useState('selectedDate')

const params = useState('params')

const route = useRoute()

const in_home = computed(() => route.name === 'index')
const show_calendar = computed(() => !settings.value.hide_calendar && in_home.value)
const show_search_bar = computed(() => in_home.value)

const { data: collections } = await useFetch<Collection[]>('/api/collections/home')

const show_collections_bar = true  // TODO

</script>

<template>
    <div id="navsearch" class="mt-2 mt-sm-4" v-if='show_collections_bar || show_search_bar || show_calendar'>
      
        <div class="mx-2">
            <!-- <v-menu v-if='show_search_bar' offset="y" :close-on-content-click="false" tile>
                <template v-slot:activator="{ props }">
                    <v-text-field hide-details variant="outlined" v-model="params.query" :placeholder="$t('common.search')" clearable>
                        <template v-slot:append>
                            <v-icon class="mr-2" v-if="params.query" icon="mdi-magnify" />
                            <v-icon v-if='settings.allow_recurrent_event || settings.allow_multidate_event' icon='mdi-cog' v-bind='props' />
                        </template>
                    </v-text-field>
                </template>
                <v-card>
                  <v-card-text>
                    <v-row dense>
                        <v-col v-if="settings.allow_recurrent_event">
                            <input type='checkbox' v-model='params.show_recurrent' />
                            <v-switch class="mt-0" v-model="params.show_recurrent"
                                hide-details :label="$t('event.show_recurrent')" inset />
                            </v-col>
                        </v-row>
                        <v-row v-if="show_calendar">
                            <v-col> -->
                                <!-- Calendar -->
                            <!-- </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-menu> -->
            <span v-if="show_collections_bar">
                <v-btn class="mr-2 mt-2" small variant="outlined" v-for="collection in collections" color="primary" :key="collection.id"
                :to="`/collection/${encodeURIComponent(collection.name)}`">{{ collection.name }}</v-btn>
            </span>
            
            <!-- Calendar -->
            <CoreCalendar v-if='show_calendar' />
            
        </div>
    </div> 
</template>

<style>
#navsearch {
margin: 0 auto;
max-width: 700px;
}
</style>