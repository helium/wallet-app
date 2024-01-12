import React, { memo, useCallback, useMemo } from 'react'
import useCopyText from '@hooks/useCopyText'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import useHaptic from '@hooks/useHaptic'
import { ellipsizeAddress } from '@utils/accountUtils'
import { ViewStyle } from 'react-native'
import { useColors, useSpacing } from '@theme/themeHooks'
import { BoxProps } from '@shopify/restyle'
import { Theme } from '@theme/theme'
import CopyAddress from '@assets/images/copyAddress.svg'
import ButtonPressAnimation from './ButtonPressAnimation'
import Text from './Text'
import Box from './Box'

const CopyAddressPill = ({ ...rest }: BoxProps<Theme>) => {
  const copyText = useCopyText()
  const { currentAccount } = useAccountStorage()
  const { triggerImpact } = useHaptic()
  const spacing = useSpacing()
  const { secondaryText } = useColors()

  const handleCopyAddress = useCallback(() => {
    if (!currentAccount?.solanaAddress) return

    triggerImpact('light')
    copyText({
      message: ellipsizeAddress(currentAccount?.solanaAddress),
      copyText: currentAccount?.solanaAddress,
    })
  }, [copyText, currentAccount?.solanaAddress, triggerImpact])

  const CopyAddressStyles = useMemo(() => {
    return {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.s,
      paddingHorizontal: spacing.m,
    } as ViewStyle
  }, [spacing])

  return (
    <Box flexDirection="column" alignItems="center" {...rest}>
      <ButtonPressAnimation
        backgroundColor="surfaceSecondary"
        borderRadius="round"
        marginBottom="l"
        onPress={handleCopyAddress}
        pressableStyles={CopyAddressStyles}
      >
        <Text
          variant="body2"
          color="secondaryText"
          numberOfLines={1}
          adjustsFontSizeToFit
          maxFontSizeMultiplier={1.2}
          textAlign="center"
          marginEnd="s"
        >
          {ellipsizeAddress(currentAccount?.solanaAddress || '', {
            numChars: 6,
          })}
        </Text>
        <CopyAddress width={16} height={16} color={secondaryText} />
      </ButtonPressAnimation>
    </Box>
  )
}

export default memo(CopyAddressPill)
