import ShareAddress from '@assets/images/shareAddress.svg'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import CopyAddress from '@components/CopyAddress'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import useCopyText from '@hooks/useCopyText'
import useHaptic from '@hooks/useHaptic'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Spacing } from '@theme/theme'
import { useSpacing } from '@theme/themeHooks'
import { ellipsizeAddress } from '@utils/accountUtils'
import React, { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import Share, { ShareOptions } from 'react-native-share'

const QR_CONTAINER_SIZE = 225

const ShareAddressScreen = () => {
  const { currentAccount } = useAccountStorage()
  const { triggerNavHaptic } = useHaptic()
  const spacing = useSpacing()
  const padding = useMemo(() => 'l' as Spacing, [])
  const { t } = useTranslation()
  const qrRef = useRef<{
    toDataURL: (callback: (url: string) => void) => void
  }>(null)
  const copyText = useCopyText()

  const address = useMemo(() => {
    return currentAccount?.solanaAddress
  }, [currentAccount])

  const handleShare = useCallback(async () => {
    if (!address) return

    qrRef.current?.toDataURL((imgData) => {
      const imageUrl = `data:image/png;base64,${imgData}`

      let options: ShareOptions = {
        failOnCancel: false,
        title: 'image',
        message: address,
        url: imageUrl,
        type: 'image/png',
      }

      if (Platform.OS === 'ios') {
        options = {
          failOnCancel: false,
          message: address,
          url: imageUrl,
          type: 'image/png',
          activityItemSources: [
            {
              item: {},
              placeholderItem: {
                type: 'text',
                content: address,
              },
              linkMetadata: {
                title: address,
              },
            },
          ],
        }
      }

      triggerNavHaptic()
      Share.open(options)
    })
  }, [address, triggerNavHaptic])

  if (!currentAccount || !address) return null

  return (
    <BackScreen>
      <Box flex={1}>
        <Box
          flex={1}
          justifyContent="center"
          alignItems="center"
          marginBottom="xxxl"
        >
          <Text
            variant="h2"
            color="primaryText"
            textAlign="center"
            marginBottom="s"
          >
            {currentAccount.alias}
          </Text>
          <TouchableOpacityBox
            onPress={() =>
              copyText({
                message: ellipsizeAddress(address),
                copyText: address,
              })
            }
          >
            <Text
              variant="h4"
              color="secondaryText"
              textAlign="center"
              marginBottom="xxl"
            >
              {ellipsizeAddress(address)}
            </Text>
          </TouchableOpacityBox>
          <Box
            height={QR_CONTAINER_SIZE}
            width={QR_CONTAINER_SIZE}
            backgroundColor="white"
            padding={padding}
            borderRadius="xxl"
          >
            <QRCode
              size={QR_CONTAINER_SIZE - 2 * spacing[padding]}
              value={address}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              getRef={qrRef}
            />
          </Box>
        </Box>
        <Box width="100%" flexDirection="row">
          <CopyAddress address={address} flex={1} />
          <TouchableOpacityBox
            flexDirection="row"
            padding="m"
            backgroundColor="purple500"
            borderRadius="round"
            onPress={handleShare}
            flex={1}
            alignItems="center"
            justifyContent="center"
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
