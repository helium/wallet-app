/* eslint-disable react/jsx-props-no-spreading */
import React, { memo, useCallback } from 'react'
import { BoxProps } from '@shopify/restyle'
import { useTranslation } from 'react-i18next'
import Clipboard from '@react-native-community/clipboard'
import Toast from 'react-native-simple-toast'
import CopyAddressIcon from '@assets/svgs/copyAddress.svg'
import { Theme } from '@config/theme/theme'
import useHaptic from '@hooks/useHaptic'
import { useColors } from '@config/theme/themeHooks'
import TouchableOpacityBox from './TouchableOpacityBox'
import Text from './Text'
import { ellipsizeAddress } from '../utils/accountUtils'

type Props = BoxProps<Theme> & { address: string }

const CopyAddress = ({ address, ...boxProps }: Props) => {
  const { triggerNavHaptic } = useHaptic()
  const { t } = useTranslation()
  const colors = useColors()

  const showToast = useCallback(() => {
    if (!address) return
    Toast.show(
      t('generic.copied', {
        target: ellipsizeAddress(address),
      }),
    )
  }, [address, t])

  const copyAddress = useCallback(() => {
    if (!address) return

    Clipboard.setString(address)
    showToast()
    triggerNavHaptic()
  }, [address, showToast, triggerNavHaptic])

  return (
    <TouchableOpacityBox
      {...boxProps}
      flexDirection="row"
      backgroundColor="primaryText"
      borderRadius="full"
      alignItems="center"
      padding="4"
      justifyContent="center"
      onPress={copyAddress}
      marginRight="3"
    >
      <CopyAddressIcon color={colors.primaryBackground} />
      <Text
        marginLeft="2"
        variant="textMdRegular"
        fontWeight="500"
        fontSize={17}
        color="primaryBackground"
      >
        {t('generic.copy')}
      </Text>
    </TouchableOpacityBox>
  )
}

export default memo(CopyAddress)
