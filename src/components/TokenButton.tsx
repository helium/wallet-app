import ChevronDown from '@assets/images/chevronDown.svg'
import useHaptic from '@hooks/useHaptic'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { BoxProps } from '@shopify/restyle'
import { PublicKey } from '@solana/web3.js'
import { Color, Theme } from '@theme/theme'
import { useColors, useHitSlop } from '@theme/themeHooks'
import React, { memo, useCallback, useMemo } from 'react'
import { Keyboard, StyleSheet } from 'react-native'
import Box from './Box'
import Text from './Text'
import TokenIcon from './TokenIcon'
import TouchableOpacityBox from './TouchableOpacityBox'

const TokenItem = ({ mint }: { mint?: PublicKey }) => {
  const { json } = useMetaplexMetadata(mint)
  return (
    <Box alignItems="center">
      <TokenIcon img={json?.image} size={41} />
    </Box>
  )
}

type Props = {
  onPress?: (address?: string) => void
  address?: string
  title?: string
  subtitle?: string
  showBubbleArrow?: boolean
  innerBoxProps?: BoxProps<Theme>
  mint?: PublicKey
} & BoxProps<Theme>

const TokenButton = ({
  onPress,
  address,
  title,
  subtitle,
  showBubbleArrow,
  innerBoxProps,
  mint,
  backgroundColor: backgroundColorProps,
  ...boxProps
}: Props) => {
  const hitSlop = useHitSlop('6')
  const colors = useColors()
  const { triggerImpact } = useHaptic()

  const handlePress = useCallback(() => {
    triggerImpact('light')
    Keyboard.dismiss()
    onPress?.(address)
  }, [address, onPress, triggerImpact])

  const textColor = useMemo((): Color => {
    return 'secondaryText'
  }, [])

  return (
    <TouchableOpacityBox
      hitSlop={hitSlop}
      alignItems="center"
      onPress={handlePress}
      disabled={!onPress}
      {...boxProps}
    >
      <Box
        backgroundColor={backgroundColorProps as Color}
        borderRadius="4xl"
        alignItems="center"
        flexDirection="row"
        paddingHorizontal={innerBoxProps?.paddingHorizontal || '6'}
        paddingVertical={innerBoxProps?.paddingVertical || '4'}
        {...innerBoxProps}
      >
        <TokenItem mint={mint} />
        <Box flex={1}>
          <Text
            marginLeft="3"
            marginRight="xs"
            variant="textLgMedium"
            color="primaryText"
          >
            {title}
          </Text>
          {!!subtitle && (
            <Text marginLeft="3" variant="textXsRegular" color={textColor}>
              {subtitle}
            </Text>
          )}
        </Box>
        <ChevronDown color={colors[textColor]} />
      </Box>
      {showBubbleArrow && (
        <Box height={18}>
          <Box
            backgroundColor={backgroundColorProps as Color}
            alignSelf="center"
            style={styles.rotatedBox}
          />
        </Box>
      )}
    </TouchableOpacityBox>
  )
}

const styles = StyleSheet.create({
  rotatedBox: {
    height: 18,
    width: 18,
    margin: -9,
    transform: [{ rotate: '45deg' }],
  },
})

export default memo(TokenButton)
