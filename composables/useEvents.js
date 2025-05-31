// import type { Event } from '#build/types/nitro-imports'
import { refDebounced } from '@vueuse/core'
/**
* A composable to get events in homepage and calendar with optional filtering.
* by default this will get events since the start of the month, this way we can populate the calendar with dots and users could click
* on the past saturday to remember where they were
*
*/
import { useState, watch } from '#imports'

export const useEvents = () => {
  // const events = useState('events', () => [])

  const params = useState('params', () => ({ start: 0, show_recurrent: false }))
  watch(params, (old) => {
    console.error(old)
  }, { deep: true })
  const { data: events} = useFetch('/api/events', {
    params,
    server: false,
    immediate: false,
    key: '/api/events',
    // transform: (e) => {
    //   console.error('dentro transform!')
    //   return e
    // }
    // watch: [params]
  })


  return {
    events,
    params
  }
}