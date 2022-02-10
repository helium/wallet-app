import React, { memo, useCallback } from 'react'
import ChevronDown from '@assets/images/chevronDown.svg'
import { Keyboard, StyleSheet } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import TestnetIcon from '@assets/images/testnetIcon.svg'
import { useColors, useHitSlop } from '../theme/themeHooks'
import AccountIcon from './AccountIcon'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'
import { Theme } from '../theme/theme'

type Props = {
  onPress?: () => void
  address?: string
  title?: string
  subtitle?: string
  showBubbleArrow?: boolean
  isTestnet?: boolean
} & BoxProps<Theme>

const AccountButton = ({
  onPress,
  address,
  title,
  subtitle,
  showBubbleArrow,
  isTestnet,
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
        backgroundColor="surfaceSecondary"
        borderRadius="xl"
        alignItems="center"
        flexDirection="row"
        paddingHorizontal="l"
        paddingVertical="m"
      >
        <AccountIcon size={40} address={address} />
        <Box flex={1}>
          <Box flexDirection="row">
            <Text marginLeft="ms" marginRight="xs" variant="subtitle2">
              {title}
            </Text>
            {isTestnet && <TestnetIcon color={secondaryText} />}
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
          backgroundColor="surfaceSecondary"
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
