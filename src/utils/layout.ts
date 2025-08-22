import { Dimensions, PixelRatio } from 'react-native'

export const { width, height } = Dimensions.get('window')
export const hp = (percentage: number) =>
  Math.round((percentage * height) / 100)
export const wp = (percentage: number) => Math.round((percentage * width) / 100)
export const ww = width
export const wh = height

// Font scaling utilities for responsive design
const BASE_WIDTH = 375 // iPhone 6/7/8 width as baseline
const BASE_HEIGHT = 667

// Determine device type
export const getDeviceType = (): 'small' | 'medium' | 'large' => {
  if (width <= 375) return 'small'
  if (width <= 390) return 'medium'
  return 'large'
}

// Calculate responsive font scale
export const getFontScale = (): number => {
  const deviceType = getDeviceType()
  const baseScale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT)

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
export const responsiveFontSize = (baseSize: number): number => {
  const scale = getFontScale()
  const scaledSize = baseSize * scale

  // Apply pixel ratio rounding for crisp text
  return Math.round(PixelRatio.roundToNearestPixel(scaledSize))
}

// Get maximum font size multiplier based on device
export const getMaxFontSizeMultiplier = (): number => {
  const deviceType = getDeviceType()

  switch (deviceType) {
    case 'small':
      return 1.3 // Allow more scaling on small devices for accessibility
    case 'medium':
      return 1.4 // Standard scaling
    case 'large':
      return 1.5 // Allow more scaling on large devices
    default:
      return 1.4
  }
}
