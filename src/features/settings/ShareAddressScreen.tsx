import useCopyText from '@hooks/useCopyText'
import { useNavigation } from '@react-navigation/native'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { Text } from '@ui/Text'
import { ellipsizeAddress } from '@utils/accountUtils'
import { Copy, Share as ShareIcon } from 'lucide-react-native'
import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import Share, { ShareOptions } from 'react-native-share'
import { withUniwind } from 'uniwind'
import SettingsBackHeader from './SettingsBackHeader'

const CopyIcon = withUniwind(Copy)
const ShareLucide = withUniwind(ShareIcon)
const SafeArea = withUniwind(TabSafeAreaView)

const QR_CONTAINER_SIZE = 225
const QR_PADDING = 24

const ShareAddressScreen = () => {
  const { currentAccount } = useAccountStorage()
  const navigation = useNavigation()
  const { t } = useTranslation()
  const qrRef = useRef<{
    toDataURL: (callback: (url: string) => void) => void
  }>(null)
  const copyText = useCopyText({ haptic: false })

  const address = currentAccount?.solanaAddress

  const handleShare = () => {
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

      void Share.open(options)
    })
  }

  if (!currentAccount || !address) return null

  const copyAddress = () =>
    copyText({
      message: ellipsizeAddress(address),
      copyText: address,
    })

  return (
    <SafeArea edges={['bottom']} className="flex-1 bg-background">
      <SettingsBackHeader onBack={navigation.goBack} />
      <View className="mb-15 flex-1 items-center justify-center px-6">
        <Text size="3xl" className="mb-2 text-center font-semibold">
          {currentAccount.alias}
        </Text>
        <PressableScale feedback="opacity" onPress={copyAddress}>
          <Text size="lg" className="mb-10 text-center text-muted-foreground">
            {ellipsizeAddress(address)}
          </Text>
        </PressableScale>
        <View
          className="rounded-[24px] bg-white"
          style={{
            height: QR_CONTAINER_SIZE,
            width: QR_CONTAINER_SIZE,
            padding: QR_PADDING,
          }}
        >
          <QRCode
            size={QR_CONTAINER_SIZE - 2 * QR_PADDING}
            value={address}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            getRef={qrRef}
          />
        </View>
      </View>
      <View className="mx-6 mb-4 flex-row gap-3">
        <Button
          variant="secondary"
          size="dashboard"
          className="flex-1 flex-row gap-2"
          onPress={copyAddress}
        >
          <CopyIcon size={16} colorClassName="accent-foreground" />
          <Text className="font-medium">{t('generic.copy')}</Text>
        </Button>
        <Button
          variant="cta"
          size="dashboard"
          className="flex-1 flex-row gap-2"
          onPress={handleShare}
        >
          <ShareLucide size={16} colorClassName="accent-white" />
          <Text className="font-medium text-white">{t('generic.share')}</Text>
        </Button>
      </View>
    </SafeArea>
  )
}

export default ShareAddressScreen
