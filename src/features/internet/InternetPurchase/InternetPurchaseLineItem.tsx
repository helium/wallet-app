import { BoxProps } from '@shopify/restyle'
import React, { memo } from 'react'
import Box from '../../../components/Box'
import Text from '../../../components/Text'
import { Theme } from '../../../theme/theme'

type Props = {
  title: string
  value: string
  subValue?: string
  error?: string
  visible?: boolean
} & BoxProps<Theme>
const InternetPurchaseLineItem = ({
  title,
  value,
  subValue,
  error,
  visible = true,
  ...boxProps
}: Props) => {
  if (!visible) return null

  return (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <Box {...boxProps}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Text variant="body1" color="primaryText">
          {title}
        </Text>
        <Text variant="body1" color="primaryText" fontSize={25}>
          {value}
        </Text>
      </Box>
      {subValue && (
        <Text variant="body1" color="secondaryText" alignSelf="flex-end">
          {subValue}
        </Text>
      )}
      {error && (
        <Text variant="body1" color="error" alignSelf="flex-end">
          {error}
        </Text>
      )}
    </Box>
  )
}

export default memo(InternetPurchaseLineItem)
