import { DarkTheme, Theme } from '@react-navigation/native'
import { darkThemeColors, lightThemeColors } from '../theme/theme'

// Native tabs and native-stack headers read `dark` for the iOS interface style
export const navigationTheme = (colorScheme: 'dark' | 'light'): Theme => ({
  ...DarkTheme,
  dark: colorScheme !== 'light',
  colors: {
    ...DarkTheme.colors,
    background:
      colorScheme === 'light'
        ? lightThemeColors.primaryBackground
        : darkThemeColors.primaryBackground,
  },
})
