import React, { memo } from 'react'
import {
  ActivityIndicatorProps,
  ActivityIndicator as RNActivityIndicator,
} from 'react-native'
import { Color } from '@config/theme/theme'
import { useColors } from '@config/theme/themeHooks'

type Props = { color?: Color } & ActivityIndicatorProps
const ActivityIndicator = ({ color, ...props }: Props) => {
  const colors = useColors()
  return (
    <RNActivityIndicator color={colors[color || 'secondaryText']} {...props} />
  )
}

export default memo(ActivityIndicator)
