import React, { memo } from 'react'
import Box from './Box'

type Props = { filled?: boolean }
const dotSize = 16
const Dot = ({ filled }: Props) => {
  return (
    <Box
      borderWidth={1}
      marginHorizontal="xs"
      borderColor={filled ? 'purple500' : 'surfaceSecondaryText'}
      width={dotSize}
      height={dotSize}
      borderRadius="round"
      backgroundColor={filled ? 'purple500' : undefined}
    />
  )
}

export default memo(Dot)
