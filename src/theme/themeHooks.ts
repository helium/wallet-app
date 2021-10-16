import { useTheme } from '@shopify/restyle'
import tinycolor from 'tinycolor2'
import { ViewStyle } from 'react-native'
import { useCallback, useMemo } from 'react'
import { ww } from '../utils/layout'
import { Color, Theme } from './theme'

export const useColors = () => {
  const { colors } = useTheme<Theme>()
  return colors
}

export const useOpacity = (color: Color, alpha: number) => {
  const colors = useColors()

  const alphaColor = tinycolor(colors[color]).setAlpha(alpha).toRgbString()

  const backgroundStyle = useMemo(() => {
    return { backgroundColor: alphaColor } as ViewStyle
  }, [alphaColor])

  const colorStyle = useMemo(() => {
    return { color: alphaColor } as ViewStyle
  }, [alphaColor])

  return {
    backgroundStyle,
    colorStyle,
    alphaColor,
  }
}

export const useCreateOpacity = () => {
  const colors = useColors()

  const color = useCallback(
    (c: Color, alpha: number) =>
      tinycolor(colors[c]).setAlpha(alpha).toRgbString(),

    [colors],
  )

  const backgroundStyle = useCallback(
    (c: Color, alpha: number) => {
      return {
        backgroundColor: color(c, alpha),
      } as ViewStyle
    },
    [color],
  )
  const colorStyle = useCallback(
    (c: Color, alpha: number) => {
      return {
        color: color(c, alpha),
      } as ViewStyle
    },
    [color],
  )

  return {
    backgroundStyle,
    colorStyle,
    color,
  }
}

export const useSpacing = () => {
  const { spacing } = useTheme<Theme>()
  return spacing
}

export const useBorderRadii = () => {
  const { borderRadii } = useTheme<Theme>()
  return borderRadii
}

export const useTextVariants = () => {
  const { textVariants } = useTheme<Theme>()
  return textVariants
}

export const useBreakpoints = () => {
  const { breakpoints } = useTheme<Theme>()
  const width = ww
  return {
    smallPhone: breakpoints.phone > width,
    phone: breakpoints.phone <= width,
  }
}
