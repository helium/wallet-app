import Error from '@assets/images/error.svg'
import Receive from '@assets/images/receive.svg'
import Send from '@assets/images/send.svg'
import { ReAnimatedBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { DelayedFadeIn } from '@components/FadeInOut'
import ImageBox from '@components/ImageBox'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import useCopyText from '@hooks/useCopyText'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useHaptic from '@hooks/useHaptic'
import { RouteProp, useRoute } from '@react-navigation/native'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import globalStyles from '@theme/globalStyles'
import { useColors } from '@theme/themeHooks'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, ScrollView } from 'react-native'
import { useCreateExplorerUrl } from '../../constants/urls'
import { EnrichedTransaction } from '../../types/solana'
import { ellipsizeAddress, solAddressIsValid } from '../../utils/accountUtils'
import AddressActivityItem from './AddressActivityItem'
import { ActivityStackParamList } from './activityTypes'

type Route = RouteProp<ActivityStackParamList, 'ActivityDetailsScreen'>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScamWarningImageBox(props: any): React.ReactElement<any> {
  const [dismissed, setDismissed] = useState(false)
  const { t } = useTranslation()

  if (!dismissed) {
    return (
      <Box
        width={props.width}
        height={props.height}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        <ImageBox {...props} blurRadius={100} />
        <Box
          p="s"
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          alignItems="center"
          justifyContent="center"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <Text textAlign="center" variant="body1Bold" color="red500">
            {t('activityScreen.scamWarning')}
          </Text>
          <ButtonPressable
            title={t('activityScreen.showAnyway')}
            onPress={() => setDismissed(true)}
            borderRadius="round"
            borderColor="red500"
            borderWidth={1}
            px="m"
            titleColorDisabled="black500"
            titleColor="red500"
            fontWeight="500"
            marginTop="l"
          />
        </Box>
      </Box>
    )
  }

  return <ImageBox {...props} />
}

const ActivityDetailsScreen = () => {
  const route = useRoute<Route>()
  const colors = useColors()
  const { t, i18n } = useTranslation()
  const createExplorerUrl = useCreateExplorerUrl()
  const copyText = useCopyText()
  const { triggerImpact } = useHaptic()

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

  const wallet = useCurrentWallet()
  const activityImage = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    if (enrichedTx.transactionError || confirmedSig.err) {
      return <Error color={colors.error} width={150} height={150} />
    }
    const userSignedTransaction =
      wallet && enrichedTx.signers?.includes(wallet.toBase58())

    const { tokenTransfers, events } = enrichedTx

    if (events?.compressed?.length) {
      const nft = events.compressed[0]

      if (!nft?.metadata.image) {
        return (
          <Box
            backgroundColor="surface"
            borderRadius="xl"
            width={250}
            height={250}
            justifyContent="center"
            alignItems="center"
          >
            <CircleLoader loaderSize={80} />
          </Box>
        )
      }

      return (
        <ScamWarningImageBox
          source={{
            uri: nft?.metadata?.image || '',
            cache: 'force-cache',
          }}
          width={250}
          height={250}
          borderRadius="xxl"
        />
      )
    }

    if (
      tokenTransfers?.length &&
      tokenTransfers[0].tokenMetadata?.json?.image
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

    return userSignedTransaction ? (
      <Send color={colors.blue500} width={150} height={150} />
    ) : (
      <Receive color={colors.green500} width={150} height={150} />
    )
  }, [colors, transaction, wallet])

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
      <Box marginTop="l" flex={1} width="100%" justifyContent="center">
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

    if (enrichedTx.transactionError || confirmedSig.err) {
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
  }, [t, transaction])

  const handleOpenExplorer = useCallback(async () => {
    const url = createExplorerUrl('txn', transaction.signature)
    await Linking.openURL(url)
  }, [createExplorerUrl, transaction.signature])

  const toggleActionSheet = useCallback(
    (open) => () => {
      setOptionsOpen(open)
    },
    [],
  )

  const handleCopyAddress = useCallback(() => {
    if (!selectedAddress) return
    triggerImpact('light')
    copyText({
      message: ellipsizeAddress(selectedAddress),
      copyText: selectedAddress,
    })
    setOptionsOpen(false)
  }, [copyText, selectedAddress, triggerImpact])

  const accountOptions = useCallback(
    () => (
      <>
        <ListItem
          key="copyAddress"
          title={t('settings.sections.account.copyAddress')}
          onPress={handleCopyAddress}
          selected={false}
          hasPressedState={false}
        />
      </>
    ),
    [handleCopyAddress, t],
  )

  return (
    <ReAnimatedBox entering={DelayedFadeIn} style={globalStyles.container}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
        }}
      >
        <BackScreen
          title={t('activityScreen.activityDetails')}
          flex={1}
          headerTopMargin="m"
        >
          <Box alignItems="center" justifyContent="center" flex={1}>
            <Box justifyContent="center" alignItems="center" marginTop="m">
              {activityImage}
              <Text
                variant="h1Medium"
                marginTop="m"
                marginBottom="s"
                textAlign="center"
              >
                {title}
              </Text>
              <Text
                variant="subtitle3"
                color="offWhite"
                marginBottom="s"
                textAlign="center"
              >
                {description}
              </Text>
              <Text variant="body3" textAlign="center" color="secondaryText">
                {dateLabel}
              </Text>
            </Box>
            {AccountAddressListItems}
            <Box width="100%">
              <ButtonPressable
                marginTop="xl"
                marginHorizontal="m"
                borderRadius="round"
                backgroundColor="white"
                titleColorDisabled="grey600"
                backgroundColorDisabled="white"
                backgroundColorDisabledOpacity={0.1}
                title={t('activityScreen.viewOnExplorer')}
                titleColor="black"
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
    </ReAnimatedBox>
  )
}

export default ActivityDetailsScreen
