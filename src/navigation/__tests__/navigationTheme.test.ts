import { navigationTheme } from '../navigationTheme'

// @react-navigation/native ships ESM that jest does not transform.
jest.mock('@react-navigation/native', () => ({
  DefaultTheme: {
    dark: false,
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
  it('marks the theme as light, to match the light palette', () => {
    expect(navigationTheme('#fff').dark).toBe(false)
  })

  it('uses the given background colour', () => {
    expect(navigationTheme('#fff').colors.background).toBe('#fff')
  })
})
