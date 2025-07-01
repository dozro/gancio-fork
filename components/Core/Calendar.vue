<script setup>

import time from '~/utils/time'
const params = useState('params')
const selectedDate = useState<Date|null|undefined>('selectedDate', () => undefined)
const attributes = useState('attributes')
const theme = useTheme()

// const { startMonth } = useTime()
function updatePages (pages) {
  const start = pages?.[0] ?? pages
  const tmpStart = time.startMonth(start.year, start.month)
  if (tmpStart != params.value.start) {
    params.value.start = tmpStart
  }
}
</script>
<template>
  <DatePicker
    v-model='selectedDate'
    :locale='$i18n.locale'  
    title-position='left'
    transition='fade'
    :columns="$vuetify.display?.smAndUp ? 2 : 1"
    :is-dark="theme.global.current.value.dark"
    aria-label='Calendar'
    expanded
    :attributes='attributes'
    @update:pages="updatePages"
  />
    <!-- :first-day-of-week='settings.calendar_first_day_of_week ?? undefined' -->
</template>

<style>
/* .vc-container.vc-is-dark {
  --gray-900: #111;
  --gray-700: #333;
}

.vc-container {
  --gray-400: #999 !important;
  --rounded-lg: 4px !important;
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
} */
</style>
