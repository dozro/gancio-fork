export const useEvents = () => {
  const settings = useState<Settings>('settings')
  const route = useRoute()
  const params = useState<Record<string, unknown>>('params', () => ({
    show_recurrent: settings.value.recurrent_event_visible,
    start: time.startMonth(time.currentYear(), time.currentMonth()),
    query: route.query?.query
  }))

  const { data: events, pending, refresh } = useFetch('/api/events', { query: params.value })

  const attributes = computed(() => useAttributesFromEvents(events?.value ?? []))

  return { params, events, attributes, refresh, pending }
}
