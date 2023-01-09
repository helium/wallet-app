import React, { memo, useCallback, useMemo } from 'react'
import ChevronDown from '@assets/images/chevronDown.svg'
import { Keyboard, StyleSheet } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import TokenMOBILE from '@assets/images/tokenMOBILE.svg'
import TokenHNT from '@assets/images/tokenHNT.svg'
import { Ticker } from '@helium/currency'
import { useColors, useHitSlop } from '../theme/themeHooks'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'
import { Color, Theme } from '../theme/theme'

const TokenItem = ({ ticker }: { ticker: Ticker }) => {
  const colors = useColors()
  const color = useMemo(() => {
    return ticker === 'MOBILE' ? 'blueBright500' : 'white'
  }, [ticker])

  return (
    <Box alignItems="center">
      {ticker === 'HNT' ? (
        <TokenHNT color={colors[color]} height={41} width={41} />
      ) : (
        <TokenMOBILE color={colors[color]} height={41} width={41} />
      )}
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
  ticker: Ticker
} & BoxProps<Theme>

const TokenButton = ({
  onPress,
  address,
  title,
  subtitle,
  showBubbleArrow,
  innerBoxProps,
  ticker,
  backgroundColor: backgroundColorProps,
  ...boxProps
}: Props) => {
  const hitSlop = useHitSlop('l')
  const colors = useColors()

  const handlePress = useCallback(() => {
    Keyboard.dismiss()
    onPress?.(address)
  }, [address, onPress])

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
        borderRadius="xl"
        alignItems="center"
        flexDirection="row"
        paddingHorizontal={innerBoxProps?.paddingHorizontal || 'l'}
        paddingVertical={innerBoxProps?.paddingVertical || 'm'}
        {...innerBoxProps}
      >
        <TokenItem ticker={ticker} />
        <Box flex={1}>
          <Text marginLeft="ms" marginRight="xs" variant="subtitle2">
            {title}
          </Text>
          {!!subtitle && (
            <Text marginLeft="ms" variant="body3" color={textColor}>
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
