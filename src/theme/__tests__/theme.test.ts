import { createAppTheme } from '../theme'

jest.mock('react-native', () => ({
  PixelRatio: { roundToNearestPixel: (size: number) => size },
}))
jest.mock('react-native-safe-area-context', () => ({}))
jest.mock('@utils/layout', () => jest.requireActual('../../utils/layout'), {
  virtual: true,
})
jest.mock('@shopify/restyle', () => ({
  createTheme: <T>(theme: T) => theme,
}))

describe('createAppTheme', () => {
  it('sizes text for the window it is built for', () => {
    // 375x667: small window, scale min(1, 1) = 1, so 42 * 1 = 42
    expect(createAppTheme({ width: 375, height: 667 }).textVariants.h0).toEqual(
      expect.objectContaining({ fontSize: 42 }),
    )
    // 669x951: min(1.784, 1.426) clamps to 1.2, 42 * 1.2 = 50.4, rounds to 50
    expect(createAppTheme({ width: 669, height: 951 }).textVariants.h0).toEqual(
      expect.objectContaining({ fontSize: 50 }),
    )
  })
})
