import React, { memo, useMemo, useCallback } from 'react'
import QRCode from 'react-qr-code'
import CopyAddress from '@assets/images/copyAddress.svg'
import ShareAddress from '@assets/images/shareAddress.svg'
import { useTranslation } from 'react-i18next'
import Clipboard from '@react-native-community/clipboard'
import Toast from 'react-native-simple-toast'
import { Share } from 'react-native'
import { Spacing } from '../../theme/theme'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import useHaptic from '../../utils/useHaptic'
import { useColors, useSpacing } from '../../theme/themeHooks'
import Box from '../../components/Box'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import Text from '../../components/Text'
import BackScreen from '../../components/BackScreen'
import { ellipsizeAddress } from '../../utils/accountUtils'

const QR_CONTAINER_SIZE = 146

const ShareAddressScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { triggerNavHaptic } = useHaptic()
  const spacing = useSpacing()
  const colors = useColors()
  const padding = useMemo(() => 'm' as Spacing, [])
  const { t } = useTranslation()

  const showToast = useCallback(() => {
    if (!currentAccount?.address) return
    Toast.show(
      t('settings.sections.shareAddress.copiedToClipboard', {
        address: ellipsizeAddress(currentAccount.address),
      }),
    )
  }, [currentAccount, t])

  const copyAddress = useCallback(() => {
    if (!currentAccount?.address) return

    Clipboard.setString(currentAccount.address)
    showToast()
    triggerNavHaptic()
  }, [currentAccount, showToast, triggerNavHaptic])

  const handleShare = useCallback(() => {
    if (!currentAccount?.address) return

    Share.share({ message: currentAccount.address })
    triggerNavHaptic()
  }, [currentAccount, triggerNavHaptic])

  if (!currentAccount?.address) return null

  return (
    <BackScreen>
      <Box alignItems="center" marginTop="xxl">
        <Text
          variant="h2"
          color="primaryText"
          textAlign="center"
          marginBottom="s"
        >
          {currentAccount.alias}
        </Text>
        <Text
          variant="h4"
          color="secondaryText"
          textAlign="center"
          marginBottom="xxl"
        >
          {ellipsizeAddress(currentAccount.address)}
        </Text>
        <Box
          height={QR_CONTAINER_SIZE}
          width={QR_CONTAINER_SIZE}
          backgroundColor="white"
          padding={padding}
          borderRadius="xl"
        >
          <QRCode
            size={QR_CONTAINER_SIZE - 2 * spacing[padding]}
            value={currentAccount.address}
          />
        </Box>
        <Box flexDirection="row" alignItems="center" marginTop="lx">
          <TouchableOpacityBox
            flexDirection="row"
            backgroundColor="greenBright500"
            borderRadius="round"
            alignItems="center"
            padding="m"
            justifyContent="center"
            onPress={copyAddress}
            marginRight="ms"
          >
            <CopyAddress color={colors.primaryIcon} />
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
          <TouchableOpacityBox
            flexDirection="row"
            padding="m"
            backgroundColor="purple500"
            borderRadius="round"
            onPress={handleShare}
          >
            <ShareAddress />
            <Text
              marginLeft="s"
              variant="body1"
              fontSize={17}
              color="primaryText"
              fontWeight="500"
            >
              {t('generic.share')}
            </Text>
          </TouchableOpacityBox>
        </Box>
      </Box>
    </BackScreen>
  )
}

export default memo(ShareAddressScreen)
