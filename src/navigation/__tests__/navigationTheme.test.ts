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

describe('navigationTheme', () => {
  it('marks the theme as dark', () => {
    expect(navigationTheme('#fff').dark).toBe(true)
  })

  it('uses the given background colour', () => {
    expect(navigationTheme('#fff').colors.background).toBe('#fff')
  })
})
