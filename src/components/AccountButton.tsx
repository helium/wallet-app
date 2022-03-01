import React, { memo, useCallback } from 'react'
import ChevronDown from '@assets/images/chevronDown.svg'
import { Keyboard, StyleSheet } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import TestnetIcon from '@assets/images/testnetIcon.svg'
import { NetType } from '@helium/crypto-react-native'
import { useColors, useHitSlop } from '../theme/themeHooks'
import AccountIcon from './AccountIcon'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'
import { Spacing, Theme } from '../theme/theme'

type Props = {
  onPress?: () => void
  address?: string
  title?: string
  subtitle?: string
  showBubbleArrow?: boolean
  netType?: NetType.NetType
  innerHorizontalPadding?: Spacing
  innerVerticalPadding?: Spacing
} & BoxProps<Theme>

const AccountButton = ({
  onPress,
  address,
  title,
  subtitle,
  showBubbleArrow,
  netType = NetType.MAINNET,
  innerHorizontalPadding,
  innerVerticalPadding,
  ...boxProps
}: Props) => {
  const hitSlop = useHitSlop('l')
  const { secondaryText } = useColors()

  const handlePress = useCallback(() => {
    Keyboard.dismiss()
    onPress?.()
  }, [onPress])

  return (
    <TouchableOpacityBox
      hitSlop={hitSlop}
      alignItems="center"
      onPress={handlePress}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...boxProps}
    >
      <Box
        backgroundColor="secondary"
        borderRadius="xl"
        alignItems="center"
        flexDirection="row"
        paddingHorizontal={innerHorizontalPadding || 'l'}
        paddingVertical={innerVerticalPadding || 'm'}
      >
        <AccountIcon size={40} address={address} />
        <Box flex={1}>
          <Box flexDirection="row">
            <Text marginLeft="ms" marginRight="xs" variant="subtitle2">
              {title}
            </Text>
            {netType === NetType.TESTNET && (
              <TestnetIcon color={secondaryText} />
            )}
          </Box>
          {subtitle && (
            <Text marginLeft="ms" variant="body3" color="secondaryText">
              {subtitle}
            </Text>
          )}
        </Box>
        <ChevronDown />
      </Box>
      {showBubbleArrow && (
        <Box
          backgroundColor="secondary"
          alignSelf="center"
          style={styles.rotatedBox}
        />
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

export default memo(AccountButton)
