import React, { memo } from 'react'
import Box from './Box'

type Props = { filled?: boolean }
const dotSize = 16
const Dot = ({ filled }: Props) => {
  return (
    <Box
      borderWidth={1}
      marginHorizontal="xs"
      borderColor={filled ? 'purple.500' : 'secondaryText'}
      width={dotSize}
      height={dotSize}
      borderRadius="full"
      backgroundColor={filled ? 'purple.500' : undefined}
    />
  )
}

export default memo(Dot)
