import { createTheme } from '@shopify/restyle'

export const Font = {
  italic: 'DMSans-Italic',
  regular: 'DMSans-Regular',
  mediumItalic: 'DMSans-MediumItalic',
  medium: 'DMSans-Medium',
  bold: 'DMSans-Bold',
  boldItalic: 'DMSans-BoldItalic',
}

const textVariants = {
  h0: {
    fontFamily: Font.regular,
    fontSize: 42,
    color: 'primaryText',
  },
  h1: {
    fontFamily: Font.regular,
    fontSize: 37,
    color: 'primaryText',
  },
  h2: {
    fontFamily: Font.regular,
    fontSize: 33,
    color: 'primaryText',
  },
  h3: {
    fontFamily: Font.regular,
    fontSize: 27,
    color: 'primaryText',
  },
  h4: {
    fontFamily: Font.regular,
    fontSize: 22,
    color: 'primaryText',
  },
  subtitle1: {
    fontFamily: Font.medium,
    fontSize: 20,
    color: 'primaryText',
  },
  subtitle2: {
    fontFamily: Font.medium,
    fontSize: 19,
    color: 'primaryText',
  },
  subtitle3: {
    fontFamily: Font.medium,
    fontSize: 17,
    color: 'primaryText',
  },
  subtitle4: {
    fontFamily: Font.medium,
    fontSize: 14,
    color: 'primaryText',
  },
  body1: {
    fontFamily: Font.regular,
    fontSize: 17,
    color: 'primaryText',
  },
  body2: {
    fontFamily: Font.regular,
    fontSize: 14,
    color: 'primaryText',
  },
  body3: {
    fontFamily: Font.regular,
    fontSize: 12,
    color: 'primaryText',
  },
  regular: {
    fontFamily: Font.regular,
    color: 'primaryText',
  },
}

const palette = {
  black200: '#41434F',
  black300: '#444755',
  black400: '#3D435B',
  black500: '#3B3E48',
  black600: '#32343E',
  black700: '#131419',
  black800: '#1A1C22',
  black900: '#000000',

  blueBright500: '#009FF9',

  darkGrey: '#333333',

  gold: '#FFD700',

  greenBright500: '#27EE76',

  grey100: '#F7F7F7',
  grey200: '#EFEFF0',
  grey300: '#AEAEAE',
  grey400: '#7E8399',
  grey500: '#747A92',
  grey600: '#565B6D',
  grey700: '#5A5E6C',
  grey800: '#54596F',
  grey900: '#2C2E37',

  offWhite: '#F9FAFC',

  orange500: '#FFB156',

  purple500: '#B556FF',

  red200: '#F59CA2',
  red300: '#F97570',
  red400: '#FF6666',
  red500: '#E43B70',

  transparent: '#00000000',

  white: '#FFFFFF',
}

export const lightThemeColors = {
  ...palette,

  primary: palette.white,
  secondary: palette.grey300,
  primaryBackground: palette.grey200,
  primaryText: palette.black700,
  primaryIcon: palette.black700,
  secondaryIcon: palette.black300,
  secondaryText: palette.grey400,
  error: palette.red500,
  surface: palette.white,
  surfaceText: palette.grey700,
  surfaceSecondary: palette.grey100,
  surfaceSecondaryText: palette.black500,
  surfaceContrast: palette.grey600,
  surfaceContrastText: palette.white,
  plainInputBackground: palette.grey200,
  regularInputBackground: palette.offWhite,
}
export const darkThemeColors = {
  ...palette,

  primary: palette.black900,
  secondary: palette.grey900,
  primaryBackground: palette.black800,
  primaryText: palette.white,
  primaryIcon: palette.black600,
  secondaryIcon: palette.black300,
  secondaryText: palette.grey400,
  error: palette.red500,
  surface: palette.grey600,
  surfaceText: palette.white,
  surfaceSecondary: palette.black600,
  surfaceSecondaryText: palette.grey500,
  surfaceContrast: palette.white,
  surfaceContrastText: palette.grey900,
  plainInputBackground: palette.black200,
  regularInputBackground: palette.black800,
}

export const theme = createTheme({
  colors: lightThemeColors,
  spacing: {
    n_xxxxl: -240,
    n_xxxl: -60,
    n_xxl: -48,
    n_xl: -32,
    n_lx: -28,
    n_l: -24,
    n_lm: -20,
    n_m: -16,
    n_ms: -12,
    n_s: -8,
    n_xs: -4,
    n_xxs: -2,
    n_xxxs: -1,
    none: 0,
    xxxs: 1,
    xxs: 2,
    xs: 4,
    sx: 6,
    s: 8,
    ms: 12,
    m: 16,
    lm: 20,
    l: 24,
    lx: 28,
    xl: 32,
    xxl: 48,
    xxxl: 60,
    xxxxl: 240,
  },
  borderRadii: {
    none: 0,
    s: 4,
    ms: 6,
    m: 8,
    lm: 10,
    l: 12,
    xl: 20,
    round: 1000,
  },
  breakpoints: {
    smallPhone: 0,
    phone: 380,
    tablet: 768,
  },
  cardVariants: {
    regular: {
      padding: 'ms',
      borderRadius: 'ms',
      backgroundColor: 'surface',
    },
    elevated: {
      shadowColor: 'surface',
      borderRadius: 'm',
      shadowOffset: {
        width: 0,
        height: 9,
      },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 9,
    },
    modal: {
      backgroundColor: 'surface',
      borderRadius: 'xl',
    },
  },
  textVariants,
  inputVariants: {
    plain: {
      color: 'primaryText',
      fontSize: 19,
      paddingBottom: 'm',
      paddingTop: 'm',
      paddingHorizontal: 'xl',
      backgroundColor: 'plainInputBackground',
    },
    regular: {
      color: 'primaryText',
      fontSize: 19,
      padding: 'm',
      backgroundColor: 'regularInputBackground',
      borderRadius: 'lm',
    },
    transparent: {
      color: 'primaryText',
      fontSize: 19,
      padding: 'm',
      backgroundColor: 'transparent',
      borderRadius: 'lm',
    },
    underline: {
      fontSize: textVariants.h1.fontSize,
      color: 'purple500',
      borderBottomColor: 'purple500',
      borderBottomWidth: 2,
      paddingBottom: 'xs',
    },
  },
})

export type Theme = typeof theme
export type TextVariant = keyof Theme['textVariants']
export type Spacing = keyof Theme['spacing']
export type Color = keyof Theme['colors']
export type BorderRadii = keyof Theme['borderRadii']
export type FontWeight =
  | '500'
  | 'bold'
  | 'normal'
  | '100'
  | '200'
  | '300'
  | '400'
  | '600'
  | '700'
  | '800'
  | '900'
