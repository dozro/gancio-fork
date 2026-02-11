let _events: Ref<EventAPI[] | undefined>
let _pending: Ref<boolean>
let _refresh: () => Promise<void>
let _initialized = false

export const useEvents = () => {
  const settings = useState<Settings>('settings')
  const route = useRoute()
  const params = useState<Record<string, unknown>>('params', () => ({
    show_recurrent: settings.value.recurrent_event_visible,
    start: time.startMonth(time.currentYear(), time.currentMonth()),
    query: route.query?.query
  }))

  if (!_initialized) {
    const { data, pending, refresh } = useAsyncData(
      'events',
      () => {
        const reqParams = { ...params.value }
        if (params.value.query) { // Either search by date or by query, not both
          reqParams.start = undefined
        }
        return $fetch<EventAPI[]>('/api/events', { params: reqParams })
      },
      { watch: [params] }
    )
    _events = data
    _pending = pending
    _refresh = refresh
    _initialized = true
  }

  const attributes = computed(() => _events.value ? useAttributesFromEvents(_events.value) : [])

  return { params, events: _events, attributes, refresh: _refresh, pending: _pending }
}