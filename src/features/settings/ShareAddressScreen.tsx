import React, { memo, useMemo, useCallback, useRef } from 'react'
import QRCode from 'react-native-qrcode-svg'
import ShareAddress from '@assets/images/shareAddress.svg'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import Share, { ShareOptions } from 'react-native-share'
import { Spacing } from '../../theme/theme'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import useHaptic from '../../utils/useHaptic'
import { useSpacing } from '../../theme/themeHooks'
import Box from '../../components/Box'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import Text from '../../components/Text'
import BackScreen from '../../components/BackScreen'
import { ellipsizeAddress } from '../../utils/accountUtils'
import CopyAddress from '../../components/CopyAddress'

const QR_CONTAINER_SIZE = 146

const ShareAddressScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { triggerNavHaptic } = useHaptic()
  const spacing = useSpacing()
  const padding = useMemo(() => 'm' as Spacing, [])
  const { t } = useTranslation()
  const qrRef = useRef<{
    toDataURL: (callback: (url: string) => void) => void
  }>(null)

  const handleShare = useCallback(async () => {
    if (!currentAccount?.address) return

    qrRef.current?.toDataURL((imgData) => {
      const imageUrl = `data:image/png;base64,${imgData}`

      let options: ShareOptions = {
        failOnCancel: false,
        title: 'image',
        message: currentAccount?.address,
        url: imageUrl,
        type: 'image/png',
      }

      if (Platform.OS === 'ios') {
        options = {
          failOnCancel: false,
          message: currentAccount?.address,
          url: imageUrl,
          type: 'image/png',
          activityItemSources: [
            {
              item: {},
              placeholderItem: {
                type: 'text',
                content: currentAccount?.address,
              },
              linkMetadata: {
                title: currentAccount?.address,
              },
            },
          ],
        }
      }

      triggerNavHaptic()
      Share.open(options)
    })
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
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            getRef={qrRef}
          />
        </Box>
        <Box flexDirection="row" alignItems="center" marginTop="lx">
          <CopyAddress address={currentAccount?.address} />
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
