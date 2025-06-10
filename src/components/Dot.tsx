import { Color } from '@theme/theme'
import React, { memo } from 'react'
import Box from './Box'

type Props = { filled?: boolean; color?: Color; size?: number }
const defaultSize = 16
const Dot = ({ filled, color = 'purple500', size = defaultSize }: Props) => {
  return (
    <Box
      borderWidth={1}
      marginHorizontal="xs"
      borderColor={filled ? color : 'surfaceSecondaryText'}
      width={size}
      height={size}
      borderRadius="round"
      backgroundColor={filled ? color : undefined}
    />
  )
}

export default memo(Dot)
