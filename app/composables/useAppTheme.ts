import { useTheme } from 'vuetify'

export const useAppTheme = () => {
  const theme = useTheme()
  const cookie = useCookie<'light' | 'dark' | 'system' | undefined>('theme')

  if (process.client) {
    theme.global.name.value = cookie.value || 'system'
  }

  const toggleTheme = () => {
    const newTheme = theme.global.current.value.dark ? 'light' : 'dark'
    theme.toggle()
    cookie.value = newTheme
  }

  return { theme, toggleTheme }
}

