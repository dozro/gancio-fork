import { useTheme } from 'vuetify'

export const useAppTheme = () => {
  const theme = useTheme()
  const cookie = useCookie<'light' | 'dark' | 'system'>('theme')

  if (import.meta.client) {
    theme.change(cookie.value || 'system')
    if (!cookie.value) {
      cookie.value = 'system'
    }
  }

  const toggleTheme = () => {
    const newTheme = theme.global.current.value.dark ? 'light' : 'dark'
    theme.change(newTheme)
    cookie.value = newTheme
  }

  return { theme, toggleTheme }
}
