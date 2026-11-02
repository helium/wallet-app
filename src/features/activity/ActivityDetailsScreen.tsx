import {
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import useCopyText from '@hooks/useCopyText'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Sheet } from '@ui/Sheet'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  CircleX,
} from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ImageProps, Linking, ScrollView, View } from 'react-native'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import { useCreateExplorerUrl } from '../../constants/urls'
import { EnrichedTransaction } from '../../types/solana'
import { ellipsizeAddress, solAddressIsValid } from '../../utils/accountUtils'
import AddressActivityItem from './AddressActivityItem'
import { ActivityStackParamList } from './activityTypes'

type Route = RouteProp<ActivityStackParamList, 'ActivityDetailsScreen'>

const SafeArea = withUniwind(TabSafeAreaView)
const BackIcon = withUniwind(ChevronLeft)
const SendIcon = withUniwind(ArrowUpRight)
const ReceiveIcon = withUniwind(ArrowDownLeft)
const ErrorIcon = withUniwind(CircleX)

const ScamWarningImage = (props: ImageProps) => {
  const [dismissed, setDismissed] = useState(false)
  const { t } = useTranslation()

  if (dismissed) return <Image {...props} />

  return (
    <View className="relative items-center justify-center">
      <Image {...props} blurRadius={100} />
      <View className="absolute inset-0 items-center justify-center rounded-[35px] bg-primary/50 p-2">
        <Text size="base" className="text-center font-bold text-destructive">
          {t('activityScreen.scamWarning')}
        </Text>
        <Button
          variant="outline"
          size="lg"
          className="mt-6"
          onPress={() => setDismissed(true)}
        >
          {t('activityScreen.showAnyway')}
        </Button>
      </View>
    </View>
  )
}

const ActivityDetailsScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation()
  const { t, i18n } = useTranslation()
  const createExplorerUrl = useCreateExplorerUrl()
  const copyText = useCopyText({ haptic: false })
  const wallet = useCurrentWallet()
  const optionsRef = useRef<BottomSheetModal>(null)

  const { transaction } = route.params
  const enrichedTx = transaction as EnrichedTransaction
  const confirmedSig = transaction as ConfirmedSignatureInfo

  const [selectedAddress, setSelectedAddress] = useState<string>('')

  const dateLabel = (() => {
    const date = new Date()

    if (enrichedTx.timestamp) {
      date.setTime(enrichedTx.timestamp * 1000)
    }

    if (confirmedSig.blockTime) {
      date.setTime(confirmedSig.blockTime * 1000)
    }

    // Format date in DD/MMMM/YYYY format
    const formattedString = date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

    const time = `${date.getHours()}:${
      date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`
    }`

    return `${formattedString} | ${time}`
  })()

  const activityImage = (() => {
    if (enrichedTx.transactionError || confirmedSig.err) {
      return <ErrorIcon size={150} colorClassName="accent-destructive" />
    }
    const userSignedTransaction =
      wallet && enrichedTx.signers?.includes(wallet.toBase58())

    const { tokenTransfers, events } = enrichedTx

    if (events?.compressed?.length) {
      const nft = events.compressed[0]

      if (!nft?.metadata.image) {
        return (
          <View className="size-[250px] items-center justify-center rounded-[20px] bg-card">
            <Spinner size="large" />
          </View>
        )
      }

      return (
        <ScamWarningImage
          source={{
            uri: nft?.metadata?.image || '',
            cache: 'force-cache',
          }}
          className="size-[250px] rounded-[35px]"
        />
      )
    }

    if (
      tokenTransfers?.length &&
      tokenTransfers[0].tokenMetadata?.json?.image
    ) {
      return (
        <Image
          source={{
            uri: tokenTransfers[0].tokenMetadata.json.image,
            cache: 'force-cache',
          }}
          className="size-[250px] rounded-[35px]"
        />
      )
    }

    return userSignedTransaction ? (
      <SendIcon size={150} colorClassName="accent-blue-dark-500" />
    ) : (
      <ReceiveIcon size={150} colorClassName="accent-success-500" />
    )
  })()

  const onAddressItemPress = (address: string) => () => {
    setSelectedAddress(address)
    optionsRef.current?.present()
  }

  const accountAddressListItems = (() => {
    if (confirmedSig.err || !enrichedTx.type) {
      return null
    }

    const firstTokenTransfer = enrichedTx.tokenTransfers?.length
      ? enrichedTx.tokenTransfers[0]
      : null
    const firstNativeTransfer = enrichedTx.nativeTransfers?.length
      ? enrichedTx.nativeTransfers[0]
      : null

    const fromAccount =
      firstTokenTransfer?.fromUserAccount ||
      firstNativeTransfer?.fromUserAccount
    const toAccount =
      firstTokenTransfer?.toUserAccount || firstNativeTransfer?.toUserAccount

    if (!fromAccount && !toAccount) {
      return null
    }

    return (
      <View className="mt-6 w-full flex-1 justify-center">
        {fromAccount && (
          <AddressActivityItem
            accountAddress={fromAccount}
            className="mx-6 mb-1"
            showBubbleArrow
            onMenuPress={onAddressItemPress(fromAccount)}
          />
        )}
        {toAccount && (
          <AddressActivityItem
            accountAddress={toAccount}
            className="mx-6"
            onMenuPress={onAddressItemPress(toAccount)}
          />
        )}
      </View>
    )
  })()

  const title = (() => {
    if (enrichedTx.transactionError || confirmedSig.err) {
      return t('activityScreen.transactionFailed')
    }

    const txnKey = `activityScreen.enrichedTransactionTypes.${enrichedTx.type}`
    return i18n.exists(txnKey)
      ? t(`activityScreen.enrichedTransactionTypes.${enrichedTx.type}`)
      : t('activityScreen.enrichedTransactionTypes.UNKNOWN')
  })()

  const description = (() => {
    if (enrichedTx.events?.compressed?.length) {
      const { symbol } = enrichedTx.events.compressed[0].metadata
      const count = enrichedTx.events.compressed.length
      if (symbol) {
        return t('activityScreen.compressedNFTDescription', {
          symbol: symbol.toLowerCase(),
          count,
        })
      }
    }

    // compressedNFTDescription
    // Custom description that ellipsizes the address
    if (enrichedTx.description) {
      const customDescription = enrichedTx.description
        ?.split(' ')
        .map((word) => {
          // Remove addresses
          if (solAddressIsValid(word)) {
            return ''
          }
          return word
        })
        .join(' ')
        .trim()

      // capitalize first letter of description
      return `${customDescription
        .charAt(0)
        .toUpperCase()}${customDescription.slice(1)}`
    }

    if (confirmedSig.err) {
      return t('generic.error')
    }

    return t('activityScreen.transactionSuccessful')
  })()

  const handleOpenExplorer = async () => {
    const url = createExplorerUrl('txn', transaction.signature)
    await Linking.openURL(url)
  }

  const handleCopyAddress = () => {
    if (!selectedAddress) return
    copyText({
      message: ellipsizeAddress(selectedAddress),
      copyText: selectedAddress,
    })
    optionsRef.current?.dismiss()
  }

  return (
    // The sheet portals to the nearest provider; this one keeps it inside
    // the screen and the app providers above it.
    <BottomSheetModalProvider>
      <View className="flex-1 bg-background">
        {/* No automatic content insets: the SafeArea already pads the
            page, and automatic insets make it scroll. */}
        <ScrollView contentContainerClassName="grow justify-center">
          <SafeArea className="flex-1">
            <View className="mt-4 flex-row items-center px-7">
              <View className="absolute inset-0 items-center justify-center">
                <Text size="xl" className="font-medium">
                  {t('activityScreen.activityDetails')}
                </Text>
              </View>
              <PressableScale
                onPress={navigation.goBack}
                hitSlop={24}
                feedback="opacity"
                accessibilityLabel={t('generic.back')}
                className="py-2"
              >
                <BackIcon size={24} colorClassName="accent-foreground" />
              </PressableScale>
            </View>
            <View className="flex-1 items-center justify-center p-7">
              <View className="mt-4 items-center justify-center">
                {activityImage}
                <Text size="4xl" className="mb-2 mt-4 text-center font-medium">
                  {title}
                </Text>
                <Text
                  size="base"
                  className="mb-2 text-center font-medium text-muted-foreground"
                >
                  {description}
                </Text>
                <Text size="xs" className="text-center text-muted-foreground">
                  {dateLabel}
                </Text>
              </View>
              {accountAddressListItems}
              <Button
                variant="cta"
                size="lg"
                className="mt-8 w-full"
                onPress={() => void handleOpenExplorer().catch(console.error)}
              >
                {t('activityScreen.viewOnExplorer')}
              </Button>
            </View>
          </SafeArea>
        </ScrollView>
        <Sheet ref={optionsRef} enablePanDownToClose>
          <BottomSheetView>
            <SafeArea edges={['bottom']} className="pb-4">
              <Text size="xl" className="px-6 pb-2 tracking-tight">
                {t('collectablesScreen.transferActions')}
              </Text>
              <PressableScale
                onPress={handleCopyAddress}
                feedback="opacity"
                className="px-6 py-4"
              >
                <Text size="base">
                  {t('settings.sections.account.copyAddress')}
                </Text>
              </PressableScale>
            </SafeArea>
          </BottomSheetView>
        </Sheet>
      </View>
    </BottomSheetModalProvider>
  )
}

export default ActivityDetailsScreen
