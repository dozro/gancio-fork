import { useTheme } from 'vuetify'

export const useAppTheme = () => {
  const theme = useTheme()
  const cookie = useCookie<'light' | 'dark' | 'system'>('theme')

  const toggleTheme = () => {
    const newTheme = theme.global.current.value.dark ? 'light' : 'dark'
    theme.change(newTheme)
    cookie.value = newTheme
  }

  const autoDetectTheme = () => {
    if (!cookie.value) {
      theme.change('system')
      const detectedTheme = theme.current.value.dark ? 'dark' : 'light'
      // Do not set the cookie to "system" because on next load it will cause hydration error.
      // Instead detect the value and set it, so that next time we don't see the blink.
      cookie.value = detectedTheme
    }
  }

  return { theme, toggleTheme, autoDetectTheme }
}
