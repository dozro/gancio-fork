<script setup>
import debounce from 'lodash/debounce'

const value = defineModel('modelValue' ,{ type: Object, default: () => ({ }) })
const settings = useState('settings')

const items = ref([])
const filters = ref([])
const collection = reactive()

const { data: collections } = await useFetch('/api/collections')

function change () {
  if (collection) {
    filters.value = []
    emit('update:modelValue', { collection, places: [], tags: [], show_recurrent: this.show_recurrent  })
  } else {
    
    const filters = {
      tags: this.filters.filter(t => t.type === 'tag').map(t => t.label),
      places: this.filters.filter(p => p.type === 'place').map(p => p.id),
      show_recurrent: this.show_recurrent
    }
    emit('update:modelValue', filters)
  }
}

// methods: {
//     search: debounce(async function(search) {
//       this.items = await this.$axios.$get(`/event/meta?search=${search.target.value}`)
//     }, 100),
//     remove (item) {
//       this.filters = this.filters.filter(m => m.type !== item.type || m.type === 'place' ? m.id !== item.id : m.label !== item.label)
//       this.change()
//     },
//     change () {
//       if (this.collection) {
//         this.filters = []
//         this.$emit('input', { collection: this.collection, places: [], tags: [], show_recurrent: this.show_recurrent  })
//       } else {
        
//         const filters = {
//           tags: this.filters.filter(t => t.type === 'tag').map(t => t.label),
//           places: this.filters.filter(p => p.type === 'place').map(p => p.id),
//           show_recurrent: this.show_recurrent
//         }
//         this.$emit('input', filters)
//       }
//     }
//   }
// }
</script>

<template>
<div class="v-row">

  <!-- filter recurrent event -->
  <div class="v-col" sm="3" cols="12">
    <v-switch
      v-if="settings.allow_recurrent_event"
      v-model="value.show_recurrent"
      :label="$t('event.show_recurrent')"
    />
  </div>
  
  <div class="v-col" sm="5" cols="12">
    <!-- @focus="search" -->
      <!-- @update:search="search" -->
    <v-autocomplete
      class="p-0"
      v-model="filters"
      no-filter
      variant='outlined'
      :label="$t('common.filter')"
      hide-details
      color="primary"
      hide-selected
      :menu-props="{ maxWidth: '400' }"
      :items="items"
      @update="change"
      hide-no-data
      item-title="label"
      return-object
      chips
      multiple
    >
      <template #chip="{ attrs, item }">
        <v-chip
          v-bind="attrs"
          size='small'
          closable
          @click:close="remove(item)"
        >
          <v-avatar start>
            <v-icon size='small' :icon="item.type === 'place' ? 'mdi-map-marker' : item.type === 'tag' ? 'mdi-tag' : 'mdi-collage'" />
          </v-avatar>
          <span>{{ item.label }}</span>
        </v-chip>
      </template>
      <template #item="{ item }">
        <v-avatar>
          <v-icon size='small' :icon="item.type === 'place' ? 'mdi-map-marker' : item.type === 'tag' ? 'mdi-tag' : 'mdi-collage'" />
        </v-avatar>
        <v-list-item-title v-text="item.label" />
        <v-list-item-subtitle v-if="item.type === 'place'" v-text="item.label !== 'online' ? item.address : ''" />
      </template>
    </v-autocomplete>
  </div>
  
  <div class="v-col" sm="4" cols="12">
      <!-- :disabled="!!filters.length" -->
    <v-autocomplete
      v-if='collections'
      class="p-0"
      v-model="value.collection"
      variant='outlined'
      :label="$t('common.collections')"
      hide-details
      color="primary"
      hide-selected
      :menu-props="{ maxWidth: '400' }"
      :items="collections"
      @update="change"
      hide-no-data
      clearable
      item-title="name"
    />
  </div>
</div>

</template>