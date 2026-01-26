import type { Event } from '#build/types/nitro-imports'

export const useEvents = () => {
  const settings = useState<Settings>('settings')
  const route = useRoute()
  const params = useState<Record<string, unknown>>('params', () => ({
    show_recurrent: settings.value.recurrent_event_visible,
    start: time.startMonth(time.currentYear(), time.currentMonth()),
    query: route.query?.query
  }))

  const { data: events, refresh, pending } = useAsyncData(
    () => $fetch<Event[]>('/api/events', { params: params.value }),
    { watch: [params.value] }
  )

  const attributes = computed(() => events.value ? useAttributesFromEvents(events.value) : [])

  return { params, events, attributes, refresh, pending }
}