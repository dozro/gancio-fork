<script setup lang="ts">
import type { EventStatus } from '~~/server/services/db'

const { event } = defineProps<{ event: EventAPI }>()
const { t } = useI18n()

const statusMap: Omit<Record<EventStatus, { color: string, title: string }>, 'EventScheduled'> = {
  EventCancelled: { color: 'error', title: t('event.cancelled'), message: t('event.cancelled_description') },
  EventPostponed: { color: 'info', title: t('event.postponed') },
  EventMovedOnline: { color: 'info', title: t('event.moved_online') },
  EventRescheduled: { color: 'warning', title: t('event.rescheduled') },
  EventTentative: { color: 'info', title: t('event.tentative') }
}

</script>
<template>
<v-alert
  v-if="event.status !== 'EventScheduled'"
  border="bottom"
  :color="statusMap[event?.status].color">
  {{statusMap[event.status].title}}
  <span class='d-none' itemprop='eventStatus'>{{event.status}}</span>
</v-alert>
</template>
