export default defineNuxtPlugin(async () => {
  const settings = useState('settings', () => null)

  if (!settings.value) {
    const { data } = await useFetch('/api/settings', {
      deep: true
    })
    settings.value = data.value
  }
})
