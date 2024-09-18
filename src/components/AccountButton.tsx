/* eslint-disable react/jsx-props-no-spreading */
import React, { memo, useCallback, useMemo } from 'react'
import ChevronDown from '@assets/images/chevronDown.svg'
import { Keyboard, StyleSheet } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import { useColors, useHitSlop } from '@theme/themeHooks'
import { Color, Theme } from '@theme/theme'
import useHaptic from '@hooks/useHaptic'
import AccountIcon from './AccountIcon'
import Box from './Box'
import Text from './Text'
import TouchableOpacityBox from './TouchableOpacityBox'

type Props = {
  onPress?: (address?: string) => void
  address?: string
  title?: string
  subtitle?: string
  showBubbleArrow?: boolean
  innerBoxProps?: BoxProps<Theme>
  showChevron?: boolean
  accountIconSize?: number
} & BoxProps<Theme>

const AccountButton = ({
  onPress,
  address,
  title,
  subtitle,
  showBubbleArrow,
  innerBoxProps,
  showChevron = true,
  accountIconSize = 28,
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
        <AccountIcon size={accountIconSize} address={address} />
        <Box flex={1}>
          {!!subtitle && (
            <Text marginLeft="3" variant="textXsRegular" color={textColor}>
              {subtitle}
            </Text>
          )}
          <Text
            marginLeft="3"
            marginRight="xs"
            variant="textLgMedium"
            color="primaryText"
          >
            {title}
          </Text>
        </Box>
        {showChevron && <ChevronDown color={colors[textColor]} />}
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

export default memo(AccountButton)
