import { useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  contentColumnMargins,
  getMaxFontSizeMultiplier,
  responsiveFontSize,
  useCollectableHeight,
  useContentWidth,
} from '../layout'

jest.mock('react-native', () => ({
  PixelRatio: { roundToNearestPixel: (size: number) => size },
  useWindowDimensions: jest.fn(),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}))

const noInsets = { left: 0, right: 0 }

describe('contentColumnMargins', () => {
  it('leaves a phone-width window uncapped', () => {
    expect(contentColumnMargins(393, noInsets)).toEqual({
      marginLeft: 0,
      marginRight: 0,
    })
  })

  it('centers a 600pt column on a wide window', () => {
    // iPad 11" portrait: (834 - 600) / 2 = 117 on each side
    expect(contentColumnMargins(834, noInsets)).toEqual({
      marginLeft: 117,
      marginRight: 117,
    })
  })

  it('keeps the column clear of a one-sided rail inset', () => {
    // 669pt window, 84pt rail on the left: 585pt left, under the cap
    expect(contentColumnMargins(669, { left: 84, right: 0 })).toEqual({
      marginLeft: 84,
      marginRight: 0,
    })
  })

  it('centers the column inside asymmetric insets', () => {
    // 900 - 84 = 816pt free; (816 - 600) / 2 = 108 gutter on each side
    expect(contentColumnMargins(900, { left: 84, right: 0 })).toEqual({
      marginLeft: 192,
      marginRight: 108,
    })
  })
})

describe('responsiveFontSize', () => {
  it('follows the window across a fold', () => {
    // iPhone Duo outer display, 466x678pt: min(466/375, 678/667) = 1.0165
    // so 42 * 1.0165 = 42.69, rounds to 43
    expect(responsiveFontSize(42, { width: 466, height: 678 })).toBe(43)
    // Inner display, 669x951pt: min(1.784, 1.426) clamps to 1.2, 42 * 1.2 = 50.4
    expect(responsiveFontSize(42, { width: 669, height: 951 })).toBe(50)
  })
})

describe('getMaxFontSizeMultiplier', () => {
  it.each([
    [375, 1.2],
    [376, 1.3],
    [390, 1.3],
    [391, 1.4],
    [430, 1.4],
  ])('gives a %ipt-wide window a %f multiplier', (width, multiplier) => {
    expect(getMaxFontSizeMultiplier({ width, height: 800 })).toBe(multiplier)
  })
})

const mockWindow = (
  width: number,
  height: number,
  insets: { left: number; right: number },
) => {
  ;(useWindowDimensions as jest.Mock).mockReturnValue({ width, height })
  ;(useSafeAreaInsets as jest.Mock).mockReturnValue({
    ...insets,
    top: 0,
    bottom: 0,
  })
}

describe('useContentWidth', () => {
  it('caps the column on a wide window with a rail inset', () => {
    // margins 192 + 108, so 900 - 300 = 600
    mockWindow(900, 1200, { left: 84, right: 0 })
    expect(useContentWidth()).toBe(600)
  })

  it('uses the full width of a phone window', () => {
    mockWindow(393, 852, noInsets)
    expect(useContentWidth()).toBe(393)
  })
})

describe('useCollectableHeight', () => {
  it('is half the content width', () => {
    // content width 600, see useContentWidth
    mockWindow(900, 1200, { left: 84, right: 0 })
    expect(useCollectableHeight()).toBe(300)
  })
})
