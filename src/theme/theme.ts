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
    lineHeight: 44,
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
  body0: {
    fontFamily: Font.regular,
    fontSize: 21,
    color: 'primaryText',
  },
  body1: {
    fontFamily: Font.regular,
    fontSize: 16,
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
  body4: {
    fontFamily: Font.regular,
    fontSize: 8,
    color: 'primaryText',
  },
  regular: {
    fontFamily: Font.regular,
  },
  medium: {
    fontFamily: Font.medium,
  },
  bold: {
    fontFamily: Font.bold,
  },
}

/**
 * Use https://www.hexdictionary.com/ to determine color names, for example https://www.hexdictionary.com/color/d23e72.
 * https://elektrobild.org/tools/sort-colors can be used to sort colors.
 */

const palette = {
  aquaMarine: '#69DBB3',

  black200: '#414141',
  black300: '#464646',
  black400: '#333333',
  black500: '#2B2B2B',
  black600: '#212121',
  black650: '#191919',
  black700: '#161616',
  black750: '#1A1A1A',
  black800: '#1A1C22',
  black850: '#131313',
  black900: '#0E0E0E',
  black900_9A: '#0000009A',

  black: '#000000',

  blue500: '#3B82F6',
  blue950: '#172554',
  blueBorder: 'rgba(59, 130, 246, 0.25)',
  hntBlue: '#2755F8',
  mobileDarkBlue: '#00273D',
  mobileBlue: '#009EF8',
  iotDarkGreen: '#053919',
  iotGreen: '#26ED75',

  green500: '#22C55E',
  green950: '#052E16',
  greenBorder: 'rgba(34, 197, 94, 0.25)',

  orange500: '#f97316',
  orange950: '#431407',
  orangeBorder: 'rgba(245, 115, 22, 0.25)',

  blueBright500: '#009FF9',

  blueRibbon: '#484CF6',

  caribbeanGreen: '#27DCB7',

  darkGrey: '#333333',

  electricViolet: '#DD0FFF',

  flamenco: '#FF800B',

  gold: '#FFD700',

  greenBright500: '#27EE76',

  grey50: '#B8B8B8',
  grey100: '#F7F7F7',
  grey200: '#EFEFF0',
  grey300: '#AEAEAE',
  grey350: '#828282',
  grey400: '#666666',
  grey500: '#747A92',
  grey600: '#999999',
  grey700: '#5A5E6C',
  grey800: '#54596F',
  grey900: '#2C2E37',
  lightGrey: '#E2E2E2',

  matchaGray900: '#2B2B2B',

  havelockBlue: '#0C93E5',

  jazzberryJam: '#D23E72',

  lividBrown: '#421B27',

  malachite: '#14D111',

  offWhite: '#F9FAFC',

  warning: '#FFE5C7',

  critical500: '#EF4444',
  critical950: '#450A0A',
  criticalBorder: 'rgba(239, 68, 68, 0.25)',

  persianRose: '#FF2DB7',

  purple500: '#B556FF',

  purpleHeart: '#3E42E5',

  red200: '#F59CA2',

  red300: '#F97570',
  red400: '#FF6666',
  red500: '#E43B70',
  red500Transparent10: '#E43B701A',
  matchaRed500: '#EF4444',
  matchaRed950: '#450A0A',
  redBorder: 'rgba(239, 68, 68, 0.25)',

  solanaGreen: '#14F195',
  solanaPurple: '#9945FF',

  transparent: '#00000000',
  transparent10: '#FFFFFF1A',

  turquoise: '#2BD7E2',

  white: '#FFFFFF',
  bottomSheetBg: '#191919',
}

export const lightThemeColors = {
  ...palette,
  primary: palette.white,
  secondary: palette.grey300,
  primaryBackground: palette.grey200,
  secondaryBackground: palette.black750,
  primaryText: palette.black700,
  primaryIcon: palette.black700,
  secondaryIcon: palette.black300,
  secondaryText: palette.grey400,
  error: palette.red500,
  surface: palette.white,
  surfaceText: palette.grey700,
  surfaceSecondary: palette.grey100,
  surfaceSecondaryText: palette.black500,
  surfaceContrast: palette.white,
  surfaceContrastText: palette.white,
  plainInputBackground: palette.grey200,
  regularInputBackground: palette.offWhite,
  highlight: palette.blueBright500,
  testnet: palette.red500,
  transparent: palette.transparent,
  bottomSheetBg: palette.bottomSheetBg,
}

export const darkThemeColors = {
  ...palette,
  primary: palette.black900,
  secondary: palette.black600,
  primaryBackground: palette.black,
  secondaryBackground: palette.black850,
  primaryText: palette.white,
  primaryIcon: palette.black600,
  secondaryIcon: palette.black300,
  secondaryText: palette.grey400,
  error: palette.red500,
  surface: palette.black200,
  surfaceText: palette.white,
  surfaceSecondary: palette.black650,
  surfaceSecondaryText: palette.grey300,
  surfaceContrast: palette.white,
  surfaceContrastText: palette.black900,
  plainInputBackground: palette.black200,
  regularInputBackground: palette.black750,
  highlight: palette.blueBright500,
  testnet: palette.red500,
  transparent: palette.transparent,
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
    lx: 16,
    xl: 20,
    xxl: 35,
    round: 1000,
  },
  breakpoints: {
    smallPhone: 0,
    phone: 380,
    largePhone: 430,
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
  textVariants: {
    ...textVariants,

    body0Medium: { ...textVariants.body0, ...textVariants.medium },
    body0Bold: { ...textVariants.body0, ...textVariants.bold },

    body1Medium: { ...textVariants.body1, ...textVariants.medium },
    body1Bold: { ...textVariants.body1, ...textVariants.bold },

    body2Medium: { ...textVariants.body2, ...textVariants.medium },
    body2Bold: { ...textVariants.body2, ...textVariants.bold },

    body3Medium: { ...textVariants.body3, ...textVariants.medium },
    body3Bold: { ...textVariants.body3, ...textVariants.bold },

    h1Medium: { ...textVariants.h1, ...textVariants.medium },
    h1Bold: { ...textVariants.h1, ...textVariants.bold },

    h2Medium: { ...textVariants.h2, ...textVariants.medium },
    h2Bold: { ...textVariants.h2, ...textVariants.bold },

    h3Medium: { ...textVariants.h3, ...textVariants.medium },
    h3Bold: { ...textVariants.h3, ...textVariants.bold },

    h4Medium: { ...textVariants.h4, ...textVariants.medium },
    h4Bold: { ...textVariants.h4, ...textVariants.bold },
  },
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
    thickBlur: {
      padding: 'm',
      borderRadius: 'xl',
      backgroundColor: 'transparent10',
    },
    thickDark: {
      padding: 'm',
      borderRadius: 'xl',
      backgroundColor: 'surfaceSecondary',
    },
    transparentSmall: {
      color: 'primaryText',
      fontSize: 16,
      padding: 's',
      paddingHorizontal: 'm',
      backgroundColor: 'transparent',
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
