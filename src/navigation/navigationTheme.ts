import { DefaultTheme, Theme } from '@react-navigation/native'

// Native tabs and native-stack headers read `dark` for the iOS interface style.
// The app has only a light palette, so the theme is light.
export const navigationTheme = (background: string): Theme => ({
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background,
  },
})
