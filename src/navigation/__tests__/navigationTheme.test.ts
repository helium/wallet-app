import { navigationTheme } from '../navigationTheme'

// @react-navigation/native ships ESM that jest does not transform.
jest.mock('@react-navigation/native', () => ({
  DarkTheme: {
    dark: true,
    colors: {
      primary: 'p',
      background: 'b',
      card: 'c',
      text: 't',
      border: 'd',
      notification: 'n',
    },
    fonts: {},
  },
}))

// theme.ts imports path aliases that jest does not resolve.
jest.mock('../../theme/theme', () => ({
  lightThemeColors: { primaryBackground: 'light-bg' },
  darkThemeColors: { primaryBackground: 'dark-bg' },
}))

describe('navigationTheme', () => {
  it('marks the dark scheme as dark', () => {
    const theme = navigationTheme('dark')
    expect(theme.dark).toBe(true)
    expect(theme.colors.background).toBe('dark-bg')
  })

  it('marks the light scheme as not dark', () => {
    const theme = navigationTheme('light')
    expect(theme.dark).toBe(false)
    expect(theme.colors.background).toBe('light-bg')
  })
})
