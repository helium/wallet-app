import React, { memo, useMemo } from 'react'
import { BoxProps } from '@shopify/restyle'
import { useHitSlop } from '../theme/themeHooks'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'
import { Color, Theme } from '../theme/theme'
import ImageBox from './ImageBox'
import { Collectable } from '../types/solana'

type Props = {
  onPress?: (address?: string) => void
  innerBoxProps?: BoxProps<Theme>
  collectable: Collectable
} & BoxProps<Theme>

const TokenButton = ({
  onPress,
  innerBoxProps,
  collectable,
  backgroundColor: backgroundColorProps,
  ...boxProps
}: Props) => {
  const hitSlop = useHitSlop('l')

  const textColor = useMemo((): Color => {
    return 'primaryText'
  }, [])

  return (
    <TouchableOpacityBox
      hitSlop={hitSlop}
      alignItems="center"
      disabled={!onPress}
      {...boxProps}
    >
      <Box
        backgroundColor={backgroundColorProps}
        borderRadius="xl"
        alignItems="center"
        flexDirection="row"
        paddingHorizontal={innerBoxProps?.paddingHorizontal || 'l'}
        paddingVertical={innerBoxProps?.paddingVertical || 'm'}
        {...innerBoxProps}
      >
        {collectable.json && (
          <ImageBox
            width={60}
            height={60}
            source={{ uri: collectable.json.image }}
            backgroundColor="surfaceSecondary"
            borderRadius="s"
          />
        )}
        <Box flex={1}>
          {collectable.json?.name && (
            <Text marginLeft="ms" marginRight="xs" variant="subtitle2">
              {collectable.json?.name}
            </Text>
          )}
          {collectable.json?.description && (
            <Text marginLeft="ms" variant="body3" color={textColor}>
              {collectable.json?.description}
            </Text>
          )}
        </Box>
      </Box>
    </TouchableOpacityBox>
  )
}

export default memo(TokenButton)
