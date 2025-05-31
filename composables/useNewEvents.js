// composables/useMyDataFetcher.ts
// const { data: events } = useFetch('/api/events')

export const data = {
  
  params: useState('eventParams', () => ({
    show_recurrent: 1,
    start: null
  })),

  ...(useFetch('/api/events', { params: data.params }))


}

// export const function useNewEvents 