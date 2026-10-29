import { PixelRatio, ScaledSize, useWindowDimensions } from 'react-native'
import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context'

export type WindowSize = Pick<ScaledSize, 'width' | 'height'>

// Widest content column on regular-width windows (iPad, iPhone Duo inner display)
export const CONTENT_MAX_WIDTH = 600

// Margins that keep a column clear of the side insets, which can differ
// (the iPhone Duo rail sits on one side), and center it at CONTENT_MAX_WIDTH
export const contentColumnMargins = (
  windowWidth: number,
  { left, right }: Pick<EdgeInsets, 'left' | 'right'>,
) => {
  const gutter = Math.max(
    0,
    (windowWidth - left - right - CONTENT_MAX_WIDTH) / 2,
  )
  return { marginLeft: left + gutter, marginRight: right + gutter }
}

export const useContentColumnMargins = () => {
  const { width } = useWindowDimensions()
  return contentColumnMargins(width, useSafeAreaInsets())
}

// Width of the content column for the current window
export const useContentWidth = () => {
  const { width } = useWindowDimensions()
  const { marginLeft, marginRight } = useContentColumnMargins()
  return width - marginLeft - marginRight
}

// A collectable tile is half the content width tall
export const useCollectableHeight = () => useContentWidth() / 2

// Font scaling utilities for responsive design
const BASE_WIDTH = 375 // iPhone 6/7/8 width as baseline
const BASE_HEIGHT = 667

// Determine device type
export const getDeviceType = ({
  width,
}: WindowSize): 'small' | 'medium' | 'large' => {
  if (width <= 375) return 'small'
  if (width <= 390) return 'medium'
  return 'large'
}

// Calculate responsive font scale
export const getFontScale = (window: WindowSize): number => {
  const deviceType = getDeviceType(window)
  const baseScale = Math.min(
    window.width / BASE_WIDTH,
    window.height / BASE_HEIGHT,
  )

  // Apply different scaling strategies per device size
  switch (deviceType) {
    case 'small':
      // Keep text readable on small devices
      return Math.max(0.95, Math.min(baseScale, 1.0))
    case 'medium':
      // Standard scaling for medium devices
      return Math.max(1.0, Math.min(baseScale, 1.1))
    case 'large':
      // Allow scaling up for large devices
      return Math.max(1.0, Math.min(baseScale, 1.2))
    default:
      return 1.0
  }
}

// Responsive font size calculator
export const responsiveFontSize = (
  baseSize: number,
  window: WindowSize,
): number => {
  const scale = getFontScale(window)
  const scaledSize = baseSize * scale

  // Apply pixel ratio rounding for crisp text
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize))
}

// Get maximum font size multiplier based on device
export const getMaxFontSizeMultiplier = (window: WindowSize): number => {
  const deviceType = getDeviceType(window)

  switch (deviceType) {
    case 'small':
      return 1.2 // Allow less scaling on small devices
    case 'medium':
      return 1.3 // Standard scaling
    case 'large':
      return 1.4 // Allow more scaling on large devices
    default:
      return 1.3
  }
}
