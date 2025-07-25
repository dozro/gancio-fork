<script setup>
// import debounce from 'lodash/debounce'
// import isEqual from 'lodash/isEqual'
// import sortBy from 'lodash/sortBy'
const { t } = useI18n()

const loading = ref(false)
const dialog = ref(false)
const valid = ref(false)
const collection = ref({ name: '', id: null })
const filterTags = ref([])
const filterPlaces = ref([])
const filterActors = ref([])
const negateFilter = ref(false)
const tags = ref([])
const places = ref([])
const filters = ref([])
const tagName = ref('')
const placeName = ref('')
const editFilterId = ref(false)
const form = ref()

const collectionHeaders = [
  { value: 'name', title: t('common.name') },
  // { value: 'filters', title: t('common.filter') },
  { value: 'pin', title: t('common.pin'), align: 'right', sortable: false },
  { value: 'actions', title: t('common.actions'), align: 'right', width: 150, sortable: false }
]

const filterHeaders = [
  { value: 'negate', title: '', width: 20, sortable: false },
  { value: 'actors', title: t('common.actors') },
  { value: 'tags', title: t('common.tags') },
  { value: 'places', title: t('common.places') },
  { value: 'actions', title: t('common.actions'), align: 'right', sortable: false }
]
const settings = useState('settings')

const in_home = !isNaN(settings.value?.collection_in_home)

const { data: collections, refresh } = await useFetch('/api/collections?withFilters=true')

// get trusted AP actors adding myself
const { data: actors } = await useFetch('/api/ap_actors/trusted', { transform: (ret) => ret.unshift({ ap_id: null })})

const collection_in_home = ref(null)

function newCollection() {
  collection.value = { name: '', id: null }
  filters.value = []
  dialog.value = true
}

async function saveCollection() {
  if (!form.value.validate()) return
  loading.value = true
  collection.name = collection.name.trim()
  await $fetch('/collections', { method: 'POST', body: collection.value })
  refresh()
  loading.value = false
}

  //   collection_in_home: {
  //     get () { return this.settings.collection_in_home },
  //     set (value) { this.setSetting({ key: 'collection_in_home', value }) }
  //   },
  // },
  // watch: {
  //   in_home (val) {
  //     this.collection_in_home = null
  //   }
  // },
  // methods: {
    // ...mapActions(['setSetting', 'setCollections']),
    // searchTags: debounce(async function (ev) {
    //   this.tags = await this.$axios.$get(`/tag?search=${encodeURIComponent(ev.target.value)}`)
    // }, 100),
    // searchPlaces: debounce(async function (ev) {
    //   this.places = await this.$axios.$get(`/place?search=${ev.target.value}`)
    // }, 100),

// async function addFilter() {
//       this.loading = true
//       const tags = this.filterTags
//       const places = this.filterPlaces.map(p => ({ id: p.id, name: p.name }))
//       const actors = this.filterActors.map(a => ({ ap_id: a.ap_id, name: a.object?.preferredUsername ?? a.object?.username ?? a?.name, domain: a?.instanceDomain ?? a.domain  }))
//       const filter = { collectionId: this.collection.id, tags, places, actors, negate: this.negateFilter }

//       // tags and places are JSON field and there's no way to use them inside a unique constrain
//       const alreadyExists = this.filters.find(f =>
//         isEqual(sortBy(f.places, 'id'), sortBy(filter.places, 'id')) && 
//         isEqual(sortBy(f.tags), sortBy(filter.tags)) &&
//         isEqual(sortBy(f.actors), sortBy(filter.actors))
//       )

//       if (this.editFilterId !== false) {
//         await this.$axios.$put(`/filter/${this.editFilterId}`, filter)
//       } else {
//         if (alreadyExists) {
//           this.$root.$message('Already exists', { color: 'warning' })
//           this.loading = false
//           return
//         }
//         await this.$axios.$post('/filter', filter )
//       }

//       this.$fetch()
//       this.filters = await this.$axios.$get(`/filter/${this.collection.id}`)

//       this.filterTags = []
//       this.filterPlaces = []
//       this.filterActors = []
//       this.negateFilter = false
//       this.editFilterId = false
//       this.loading = false
//     },
//     async editCollection(collection) {
//       this.collection = { ...collection }
//       this.filters = await this.$axios.$get(`/filter/${collection.id}`)
//       this.dialog = true
//     },
//     newCollection() {
//       this.collection = { name: '', id: null }
//       this.filters = []
//       this.dialog = true
//     },
//     async saveCollection() {
//       if (!this.$refs.form.validate()) return
//       this.loading = true
//       this.collection.name = this.collection.name.trim()
//       this.collection = await this.$axios.$post('/collections', this.collection)
//       this.$fetch()
//       this.loading = false
//     },
//     async moveUp (collection) {
//       try {
//         await this.$axios.$put(`/collection/moveup/${collection.sortIndex}`)
//         this.$fetch()
//       } catch (e) {
//         const err = get(e, 'response.data.errors[0].message', e)
//         this.$root.$message(this.$t(err), { color: 'error' })
//       }
//     },
//     async togglePinCollection (collection) {
//       try {
//         await this.$axios.$put(`/collection/toggle/${collection.id}`)
//         collection.isTop = !collection.isTop
//       } catch (e) {
//         const err = get(e, 'response.data.errors[0].message', e)
//         this.$root.$message(this.$t(err), { color: 'error' })
//       }
//     },
//     async editFilter(filter) {
//       this.filterActors = filter.actors
//       this.filterPlaces = filter.places
//       this.filterTags = filter.tags
//       this.negateFilter = filter.negate
//       this.editFilterId = filter.id
//     },
//     async removeFilter(filter) {
//       try {
//         await this.$axios.$delete(`/filter/${filter.id}`)
//         this.filters = this.filters.filter(f => f.id !== filter.id)
//         this.$fetch()
//       } catch (e) {
//         const err = get(e, 'response.data.errors[0].message', e)
//         this.$root.$message(this.$t(err), { color: 'error' })
//         this.loading = false
//       }
//     },
//     async removeCollection(collection) {
//       const ret = await this.$root.$confirm('admin.delete_collection_confirm', { collection: collection.name })
//       if (!ret) { return }
//       try {
//         await this.$axios.$delete(`/collection/${collection.id}`)
//         this.collections = this.collections.filter(c => c.id !== collection.id)
//         this.setCollections(this.collections)
//       } catch (e) {
//         const err = get(e, 'response.data.errors[0].message', e)
//         this.$root.$message(this.$t(err), { color: 'error' })
//         this.loading = false
//       }
//     }
//   }
// }
</script>
<template>
<div>
  <v-container>
    <v-card-title>
      {{ $t('common.collections') }}
      <v-spacer />
    </v-card-title>

    <v-card-subtitle v-html="$t('admin.collections_description')" />

    <v-card-text>
      <v-row>
        <v-col>
          <v-switch
            :label="$t('common.collection_in_home')"
            inset
            v-model="in_home"
          />
        </v-col>
        <v-col>
          <v-autocomplete
            v-if="in_home"
            :disabled="!!filters.length"
            v-model="collection_in_home"
            variant='outlined'
            :label="$t('common.collections')"
            hide-details
            color="primary"
            hide-selected
            :menu-props="{ maxWidth: '400' }"
            :items="collections"
            hide-no-data
            clearable
            item-title="name"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <v-btn color="primary" variant='text' @click="newCollection" prepend-icon='mdi-plus'>
      {{ $t('admin.new_collection') }}
    </v-btn>

    <v-dialog
      v-model="dialog"
      max-width="8000"
      width="800"
      destroy-on-close
      :fullscreen="$vuetify.display?.mobile"
    >
      <v-card>
        <v-card-title>
          {{ $t('admin.edit_collection') }}
        </v-card-title>
        <v-card-text>
          <v-form v-model="valid" ref="form" @submit.prevent="saveCollection">
            <v-text-field
              v-if="!collection.id"
              :rules="[$valid.required('common.name')]"
              :label="$t('common.name')"
              v-model="collection.name"
              :placeholder="$t('common.name')"
            >
              <template v-slot:append-outer v-if="!collection.id">
                <v-btn
                  variant='text'
                  @click="saveCollection"
                  color="primary"
                  :loading="loading"
                  :disabled="!valid || loading || !!collection.id"
                >
                  {{ $t('common.save') }}
                </v-btn>
              </template>
            </v-text-field>
            <h3 v-else class="text-h6" v-text="collection.name" />
          </v-form>

          <v-row>
            <v-col cols="6">
              <v-autocomplete
                v-model="filterActors"
                prepend-inner-icon="mdi-web"
                chips
                multiple
                closable-chips
                hide-no-data
                hide-selected
                persistent-hint
                :disabled="!collection.id"
                placeholder="Local"
                return-object
                hide-details
                item-value="ap_id"
                item-title="ap_id"
                :delimiters="[';', ',']"
                :items="actors"
                :label="$t('common.trusted_sources')"
              >
                <!-- <template v-slot:item="{ item }">
                  <v-list-item-avatar>
                    <v-img :src="$format.actor(item, 'icon')" />
                  </v-list-item-avatar>
                  <v-list-item-content>
                    <v-list-item-title>
                      {{ $format.actor(item, 'title') }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      {{ $format.actor(item, 'label') }}
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </template> -->
                <template #chip="{ item, attrs, selected, parent }">
                  <v-chip
                    v-bind="attrs"
                    closable
                    @click:close="parent.selectItem(item)"
                    :model-value="selected"
                    label
                    size='small'
                  >
                    {{ $format.actor(item, 'label') }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="6">
              <v-autocomplete
                v-model="filterPlaces"
                prepend-inner-icon="mdi-map-marker"
                chips
                multiple
                closable-chips
                hide-no-data
                hide-selected
                persistent-hint
                auto-select-first
                clearable
                return-object
                hide-details
                item-title="name"
                :disabled="!collection.id"
                @update:model-value="searchPlaces"
                @focus="searchPlaces"
                :delimiters="[';', ',']"
                :items="places"
                :label="$t('common.places')"
              >
                <template
                  #chip="{ item, attrs, selected, parent }">
                  <v-chip
                    v-bind="attrs"
                    closable
                    @click:close="parent.selectItem(item)"
                    :model-value="selected"
                    label
                    size='small'
                  >
                    {{ item.name }}
                  </v-chip>
                </template>
              </v-autocomplete>
            </v-col>

            <v-col cols="6">
              <v-combobox
                v-model="filterTags"
                prepend-inner-icon="mdi-tag-multiple"
                chips
                multiple
                closable-chips
                hide-no-data
                hide-selected
                persistent-hint
                :disabled="!collection.id"
                hide-details
                placeholder="All"
                @update:model-value="searchTags"
                @focus="searchTags"
                :delimiters="[';', ',']"
                :items="tags"
                :label="$t('common.tags')"
              >
                <!-- <template v-slot:selection="{ item, attrs, selected, parent }">
                  <v-chip
                    v-bind="attrs"
                    closable
                    @click:close="parent.selectItem(item)"
                    :model-value="selected"
                    label
                    size='small'
                  >
                    {{ item }}
                  </v-chip>
                </template> -->
              </v-combobox>
            </v-col>

            <v-col cols="3">
              <v-switch
                inset
                v-model="negateFilter"
                label="Not"
              />
            </v-col>
          </v-row>

          <v-data-table
            :headers="filterHeaders"
            :items="filters"
            :hide-default-footer="filters.length < 5"
          >
            <template v-slot:item.actions="{ item }">
              <v-btn @click="editFilter(item)" color="primary" icon='mdi-pencil' />
              <v-btn @click="removeFilter(item)" color="error" icon='mdi-delete-forever' />
            </template>
            <template v-slot:item.negate="{ item }">
              <v-icon
                :icon="item.negate ? 'mdi-not-equal-variant' : 'mdi-equal-box'"
                :color="item.negate ? 'warning' : 'success'"
              />
            </template>
            <template v-slot:item.tags="{ item }">
              <v-chip
                class="ma-1"
                size='small'
                label
                v-for="tag in item.tags"
                v-text="tag"
                :key="tag"
              />
            </template>
            <template v-slot:item.places="{ item }">
              <v-chip
                class="ma-1"
                size='small'
                label
                v-for="place in item.places"
                v-text="place.name"
                :key="place.id"
              />
            </template>
            <template v-slot:item.actors="{ item }">
              <v-chip
                class="ma-1"
                size='small'
                label
                v-for="actor in item.actors"
                :key="actor.ap_id"
              >
                {{ $format.actor(actor, 'filter') }}
              </v-chip>
            </template>
          </v-data-table>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            color="primary"
            v-if="editFilterId === false"
            variant='outlined'
            :loading="loading"
            @click="addFilter"
            :disabled="loading || filterActors.length<1 && filterPlaces.length<1 && filterTags.length<1"
            append-icon='mdi-plus'
          >
            {{ $t('common.add') }}
          </v-btn>
          
          <v-btn
            color="primary"
            variant='outlined'
            v-else
            :loading="loading"
            @click="addFilter"
            :disabled="loading || filterActors.length<1 && filterPlaces.length<1 && filterTags.length<1"
          >
            {{ $t('common.save') }}
          </v-btn>
          
          <v-btn
            @click="dialog = false"
            variant='outlined'
            color="warning"
            :disabled="loading || filterActors.length>0 || filterPlaces.length>0 || filterTags.length>0"
          >
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card-text>
      <v-data-table
        :headers="collectionHeaders"
        :items="collections"
        :hide-default-footer="collections.length < 5"
      >
        <template v-slot:item.pin="{ item }">
          <v-switch
            class="float-right"
            :model-value="item.isTop"
            @update="togglePinCollection(item)"
            inset
            hide-details
          />
        </template>
        <template v-slot:item.actions="{ item, index }">
          <v-btn v-if="index>0" color="warn" @click.stop="moveUp(item)" icon='mdi-chevron-up' />
          <v-btn @click="editCollection(item)" color="primary" icon='mdi-pencil' />
          <v-btn @click="removeCollection(item)" color="error" icon='mdi-delete-forever' />
        </template>
      </v-data-table>
    </v-card-text>
  </v-container>
</div>

</template>

<!-- <style>

/**  this is for the switch */
.v-data-table .v-input--selection-controls {
  margin-top: 0;
  padding-top: 0;
}
</style> -->