/* eslint-disable react/jsx-props-no-spreading */
import React, { memo, useCallback, useMemo } from 'react'
import ChevronDown from '@assets/svgs/chevronDown.svg'
import { Keyboard, StyleSheet } from 'react-native'
import { BoxProps } from '@shopify/restyle'
import { useColors, useHitSlop } from '@config/theme/themeHooks'
import { Color, Theme } from '@config/theme/theme'
import useHaptic from '@hooks/useHaptic'
import { ellipsizeAddress } from '@utils/accountUtils'
import AccountIcon from './AccountIcon'
import Box from './Box'
import Text from './Text'
import TouchableContainer from './TouchableContainer'

type Props = {
  onPress?: (address?: string) => void
  address?: string
  title?: string
  showBubbleArrow?: boolean
  showChevron?: boolean
  accountIconSize?: number
} & BoxProps<Theme>

const AccountButton = ({
  onPress,
  address,
  title,
  showBubbleArrow,
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
    return 'text.quaternary-500'
  }, [])

  return (
    <TouchableContainer
      borderRadius="2xl"
      hitSlop={hitSlop}
      alignItems="center"
      backgroundColor="cardBackground"
      backgroundColorPressed="gray.900"
      padding="xl"
      onPress={handlePress}
      disabled={!onPress}
      {...boxProps}
    >
      <Box
        backgroundColor={backgroundColorProps as Color}
        alignItems="center"
        flexDirection="row"
      >
        <AccountIcon size={accountIconSize} address={address} />
        <Box flex={1}>
          <Text marginLeft="2.5" variant="textLgSemibold" color="primaryText">
            {title}
          </Text>
          <Text
            marginLeft="2.5"
            variant="textMdRegular"
            color="text.quaternary-500"
          >
            {ellipsizeAddress(address || '', {
              numChars: 4,
            })}
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
    </TouchableContainer>
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
