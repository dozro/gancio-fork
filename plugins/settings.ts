export default defineNuxtPlugin(async () => {
  const settings = useState('settings', () => null)
  const log = useLogger('settings')
  
  if (!settings.value) {
    log.info('loading')
    const { data } = await useFetch('/api/settings')
    settings.value = data.value
  }
})