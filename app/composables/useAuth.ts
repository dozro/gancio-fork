
export default () => {
  const { user } = useUserSession()
  const isAdmin = computed(() => (user.value?.role === 'admin'))
  const isEditor = computed(() => (user.value?.role === 'admin' || user.value?.role === 'editor'))
  
  return {
    isAdmin,
    isEditor
  }
}