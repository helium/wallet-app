import { DarkTheme, Theme } from '@react-navigation/native'

// Native tabs and native-stack headers read `dark` for the iOS interface style
export const navigationTheme = (background: string): Theme => ({
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    background,
  },
})
