<script setup>

import time from '~/utils/time'

const selectedDate = useState('selectedDate')
const { attributes, params } = useEvents()

const { theme } = useAppTheme()

// const { startMonth } = useTime()
function updatePages (pages) {
  const start = pages?.[0] ?? pages
  const tmpStart = time.startMonth(start.year, start.month)
  if (tmpStart != params.value.start) {
    params.value.start = tmpStart
  }
}
const initialPage = useInitialCalendarPage()
</script>
<template>
<!-- :first-day-of-week='settings.calendar_first_day_of_week ?? undefined' -->
<!-- :columns="$vuetify.display?.smAndUp ? 2 : 1" -->
<DatePicker
  v-model='selectedDate'
  class='mt-2'
  :locale='$i18n.locale'
  title-position='left'
  transition='fade'
  :is-dark="theme.current?.value?.dark"
  aria-label='Calendar'
  expanded
  :attributes='attributes'
  :initial-page="initialPage"
  @update:pages="updatePages"
/>
</template>

<style>
.v-theme--light .vc-container {
  --vc-border: #ccc !important;
  --vc-rounded-lg: 4px !important;
  --vc-bg: rgba(250,250,250,0.5);
  /* --vc-color: var(vc--gray-900) !important; */
  backdrop-filter: blur(4px);
}

.v-theme--dark .vc-container {
  --vc-border: #333 !important;
  --vc-rounded-lg: 4px !important;
  --vc-bg: rgba(10,10,10,0.5);
  /* --vc-color: #999 !important; */
  backdrop-filter: blur(4px);
}

.vc-opacity-0 {
  opacity: 0.3 !important;
}

.past-event {
  opacity: 0.3;
}

#calendarButton {
  margin-top: -6px;
  margin-left: -10px;
}
</style>
