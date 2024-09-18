import { createTheme } from '@shopify/restyle'

import darkThemeTokens from '@novalabsxyz/mobile-theme/build/dark-theme.json'
import lightThemeTokens from '@novalabsxyz/mobile-theme/build/light-theme.json'

const NovaFont = {
  bold: 'Figtree',
  boldItalic: 'Figtree',
  italic: 'Figtree',
  light: 'Figtree',
  medium: 'Figtree',
  mediumItalic: 'Figtree',
  regular: 'Figtree',
  semiBold: 'Figtree',
}

export const breakpoints = {
  none: 0,
  xs: 300,
  sm: 400,
  md: 640,
  lg: 960,
  xl: 1200,
  xxl: 1440,
}

export const baseTheme = {
  borderRadii: lightThemeTokens.borderRadii,
  breakpoints,
  Font: NovaFont,
  inputVariants: {
    outline: {
      color: 'primaryText',
      fontSize: 18,
      fontFamily: 'Figtree',
      padding: '4',
      borderRadius: '4xl',
    },
    outlineSuccess: {
      color: 'blue.500',
      fontSize: 18,
      fontFamily: 'Figtree',
      padding: '4',
      borderRadius: '4xl',
      borderWidth: 1,
      borderColor: 'blue.500',
    },
    plain: {
      color: 'primaryText',
      fontSize: 18,
      fontFamily: 'Figtree',
      padding: '4',
      backgroundColor: 'inputBackground',
    },
    regular: {
      color: 'primaryText',
      fontSize: 18,
      fontFamily: 'Figtree',
      padding: '4',
      backgroundColor: 'inputBackground',
      borderRadius: '4xl',
    },
    transparent: {
      color: 'primaryText',
      fontSize: 19,
      padding: '4',
      backgroundColor: 'transparent',
      borderRadius: '4xl',
    },
    thickBlur: {
      padding: '4',
      borderRadius: '4xl',
      backgroundColor: 'transparent10',
    },
    thickDark: {
      padding: 'm',
      borderRadius: '4xl',
      backgroundColor: 'bg.tertiary',
    },
    transparentSmall: {
      color: 'primaryText',
      fontSize: 16,
      padding: '2',
      paddingHorizontal: '4',
      backgroundColor: 'transparent',
    },
    underline: {
      fontSize: 36,
      color: 'purple.500',
      borderBottomColor: 'purple.500',
      borderBottomWidth: 2,
      paddingBottom: 'xs',
    },
  },
  spacing: {
    ...lightThemeTokens.spacing,
  },
  textVariants: {
    ...lightThemeTokens.textVariants,
  },
}

const lightColors = lightThemeTokens.colors
const darkColors = darkThemeTokens.colors

const allSpacing = {
  ...baseTheme.spacing,
  // TODO: Add thise spacings to the theme
  '-24': -96,
  '-8': -32,
  '-7': -28,
  '-0.25': -1,
  '0.25': 1,
  '0.5': 2,
  '0.75': 3,
  '1': 4,
  '2.5': 10,
  '6': 24,
  '7': 28,
  '11': 44,
  '14': 56,
  '15': 60,
  '28': 112,
}

const lightTheme = createTheme({
  ...baseTheme,
  spacing: allSpacing,
  colors: {
    ...lightColors,

    primaryBackground: lightColors['bg.primary'], // background.bg.primary
    secondaryBackground: lightColors['bg.secondary'], // background.bg.secondary
    cardBackground: lightColors['bg.tertiary'], // background.bg.primary // add border around all cards... secondary border
    primaryText: lightColors['text.primary-900'], // text.primary.900 -> text.primary
    secondaryText: lightColors['text.secondary-700'], // text.text.secondary.700 -> text.secondary
    placeholderText: lightColors['text.placeholder'], // text.placeholder
    // accentText: palette.silver, //  text.tertiary, //probably remove
    inputBackground: lightColors['bg.primary'], // background.bg.primary // add border around all inputs... primary border
    activeBackground: lightColors['bg.active'], // background.bg.active
    inactiveIcon: lightColors['fg.disabled'], // foreground.fg.disabled
    transparent10: '#ffffff1A',
    transparent: '#00000000',
    hntBlue: '#2755F8',
    mobileDarkBlue: '#00273D',
    mobileBlue: '#009EF8',
    iotDarkGreen: '#053919',
    iotGreen: '#26ED75',
    solanaPurple: '#9945FF',
  },
})

const darkTheme = createTheme({
  ...baseTheme,
  spacing: allSpacing,
  colors: {
    ...darkColors,

    primaryBackground: darkColors['bg.primary'], // background.bg.primary
    secondaryBackground: darkColors['bg.secondary'], // background.bg.secondary
    cardBackground: darkColors['bg.tertiary'], // background.bg.primary // add border around all cards... secondary border
    primaryText: darkColors['text.primary-900'], // text.primary.900 -> text.primary
    secondaryText: darkColors['text.secondary-700'], // text.text.secondary.700 -> text.secondary
    placeholderText: darkColors['text.placeholder'], // text.placeholder
    // accentText: palette.silver, //  text.tertiary, //probably remove
    inputBackground: darkColors['bg.primary'], // background.bg.primary // add border around all inputs... primary border
    activeBackground: darkColors['bg.active'], // background.bg.active
    inactiveIcon: darkColors['fg.disabled'], // foreground.fg.disabled
    transparent10: '#ffffff1A',
    transparent: '#00000000',
  },
})

export type Theme = typeof lightTheme
export type TextVariant = keyof Theme['textVariants']
export type TextInputVariant = keyof Theme['inputVariants']
export type Spacing = keyof Theme['spacing']
export type Color = keyof Theme['colors']
export type BorderRadii = keyof Theme['borderRadii']
export type FontWeight =
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | 'normal'
  | 'bold'

export { lightColors, darkColors }

export { NovaFont as Font }

export { lightTheme, darkTheme }
