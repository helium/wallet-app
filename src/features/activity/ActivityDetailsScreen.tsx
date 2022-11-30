import { RouteProp, useRoute } from '@react-navigation/native'
import React, { useCallback, useMemo, useState } from 'react'
import { Linking, ScrollView } from 'react-native'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useTranslation } from 'react-i18next'
import Clipboard from '@react-native-community/clipboard'
import Toast from 'react-native-simple-toast'
import Animated from 'react-native-reanimated'
import ListItem from '../../components/ListItem'
import { EnrichedTransaction } from '../../types/solana'
import ImageBox from '../../components/ImageBox'
import BackScreen from '../../components/BackScreen'
import Box from '../../components/Box'
import Text from '../../components/Text'
import AddressActivityItem from './AddressActivityItem'
import ButtonPressable from '../../components/ButtonPressable'
import CheckmarkFilled from '../../assets/images/checkmarkFill.svg'
import { useColors } from '../../theme/themeHooks'
import { ellipsizeAddress, solAddressIsValid } from '../../utils/accountUtils'
import Error from '../../assets/images/error.svg'
import { ActivityStackParamList } from './activityTypes'
import BlurActionSheet from '../../components/BlurActionSheet'
import useHaptic from '../../utils/useHaptic'
import globalStyles from '../../theme/globalStyles'
import { DelayedFadeIn } from '../../components/FadeInOut'

type Route = RouteProp<ActivityStackParamList, 'ActivityDetailsScreen'>

const ActivityDetailsScreen = () => {
  const route = useRoute<Route>()
  const colors = useColors()
  const { t, i18n } = useTranslation()
  const { triggerNavHaptic } = useHaptic()

  const { transaction } = route.params

  const [optionsOpen, setOptionsOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<string>('')

  const dateLabel = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

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
  }, [transaction])

  const activityImage = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    if (confirmedSig.err) {
      return <Error color={colors.error} width={250} height={250} />
    }

    const { tokenTransfers } = enrichedTx

    if (
      tokenTransfers &&
      tokenTransfers[0].tokenMetadata &&
      tokenTransfers[0].tokenMetadata.json &&
      tokenTransfers[0].tokenMetadata.json.image
    ) {
      return (
        <ImageBox
          source={{
            uri: tokenTransfers[0].tokenMetadata.json.image,
            cache: 'force-cache',
          }}
          width={250}
          height={250}
          borderRadius="xxl"
        />
      )
    }
    return (
      <CheckmarkFilled color={colors.greenBright500} width={250} height={250} />
    )
  }, [colors, transaction])

  const onAddressItemPress = useCallback(
    (address: string) => () => {
      setSelectedAddress(address)
      setOptionsOpen(true)
    },
    [],
  )

  const AccountAddressListItems = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    if (confirmedSig.err || !enrichedTx.type) {
      return null
    }

    const firstTokenTransfer = enrichedTx.tokenTransfers[0]
    const firstNativeTransfer = enrichedTx.nativeTransfers[0]
    const fromAccount =
      firstTokenTransfer?.fromUserAccount ||
      firstNativeTransfer?.fromUserAccount
    const toAccount =
      firstTokenTransfer?.toUserAccount || firstNativeTransfer?.toUserAccount

    return (
      <Box marginTop="l" flex={1} width="100%">
        {fromAccount && (
          <AddressActivityItem
            accountAddress={fromAccount}
            marginHorizontal="l"
            marginBottom="xs"
            borderRadius="xl"
            showBubbleArrow
            onMenuPress={onAddressItemPress(fromAccount)}
          />
        )}
        {toAccount && (
          <AddressActivityItem
            accountAddress={toAccount}
            marginHorizontal="l"
            borderRadius="xl"
            onMenuPress={onAddressItemPress(toAccount)}
          />
        )}
      </Box>
    )
  }, [onAddressItemPress, transaction])

  const title = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    if (confirmedSig.err) {
      return t('activityScreen.transactionFailed')
    }

    const txnKey = `activityScreen.enrichedTransactionTypes.${enrichedTx.type}`
    return i18n.exists(txnKey)
      ? t(`activityScreen.enrichedTransactionTypes.${enrichedTx.type}`)
      : t('activityScreen.enrichedTransactionTypes.UNKNOWN')
  }, [i18n, t, transaction])

  const description = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    // Custom description that elipiizes the address
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
      return 'Error'
    }

    return 'Transaction Successful'
  }, [transaction])

  //   https://explorer.solana.com/tx/SDV21yWbuy4k8hk8rbMuZxYgMKJhUniRppzAzHZeKnTnjvWujsjMHH62TZ9wVzcpfzLgXEkDqsPz4Cw15shMY8w

  const handleOpenExplorer = useCallback(async () => {
    const url = `https://explorer.solana.com/tx/${transaction.signature}`
    // Open url in browser
    await Linking.openURL(url)
  }, [transaction.signature])

  const toggleActionSheet = useCallback(
    (open) => () => {
      setOptionsOpen(open)
    },
    [],
  )

  const showToast = useCallback(() => {
    if (!selectedAddress) return
    Toast.show(
      t('generic.copied', {
        target: ellipsizeAddress(selectedAddress),
      }),
    )
  }, [selectedAddress, t])

  const handleCopyAddress = useCallback(() => {
    if (!selectedAddress) return

    Clipboard.setString(selectedAddress)
    showToast()
    triggerNavHaptic()
    setOptionsOpen(false)
  }, [selectedAddress, showToast, triggerNavHaptic])

  const accountOptions = useCallback(
    () => (
      <>
        <ListItem
          key="copyAddress"
          title={t('settings.sections.account.copyAddress')}
          onPress={handleCopyAddress}
          selected={false}
        />
      </>
    ),
    [handleCopyAddress, t],
  )

  return (
    <Animated.View entering={DelayedFadeIn} style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      >
        <BackScreen title="Activity Details">
          <Box alignItems="center" justifyContent="center" height="100%">
            {activityImage}
            <Text variant="h2" fontWeight="bold" marginTop="m" marginBottom="s">
              {title}
            </Text>
            <Text
              variant="body0"
              fontWeight="bold"
              marginBottom="s"
              textAlign="center"
            >
              {description}
            </Text>
            <Text
              variant="body2"
              textAlign="center"
              color="secondaryText"
              fontWeight="bold"
            >
              {dateLabel}
            </Text>
            {AccountAddressListItems}
            <Box width="100%">
              <ButtonPressable
                marginTop="xl"
                marginHorizontal="m"
                flexGrow={1}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacity={1}
                backgroundColorOpacityPressed={0.05}
                titleColorDisabled="grey600"
                backgroundColorDisabled="white"
                backgroundColorDisabledOpacity={0.1}
                titleColorPressedOpacity={0.3}
                title={t('activityScreen.viewOnExplorer')}
                titleColor="black"
                fontWeight="bold"
                onPress={handleOpenExplorer}
              />
            </Box>
          </Box>
          <BlurActionSheet
            title={t('collectablesScreen.transferActions')}
            open={optionsOpen}
            onClose={toggleActionSheet(false)}
          >
            {accountOptions()}
          </BlurActionSheet>
        </BackScreen>
      </ScrollView>
    </Animated.View>
  )
}

export default ActivityDetailsScreen
