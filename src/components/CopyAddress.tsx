/* eslint-disable react/jsx-props-no-spreading */
import React, { memo, useCallback } from 'react'
import { BoxProps } from '@shopify/restyle'
import { useTranslation } from 'react-i18next'
import Clipboard from '@react-native-community/clipboard'
import Toast from 'react-native-simple-toast'
import CopyAddressIcon from '@assets/images/copyAddress.svg'
import { Theme } from '../theme/theme'
import useHaptic from '../utils/useHaptic'
import TouchableOpacityBox from './TouchableOpacityBox'
import Text from './Text'
import { ellipsizeAddress } from '../utils/accountUtils'
import { useColors } from '../theme/themeHooks'

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
      backgroundColor="greenBright500"
      borderRadius="round"
      alignItems="center"
      padding="m"
      justifyContent="center"
      onPress={copyAddress}
      marginRight="ms"
    >
      <CopyAddressIcon color={colors.primaryIcon} />
      <Text
        marginLeft="s"
        variant="body1"
        fontWeight="500"
        fontSize={17}
        color="primaryIcon"
      >
        {t('generic.copy')}
      </Text>
    </TouchableOpacityBox>
  )
}

export default memo(CopyAddress)
