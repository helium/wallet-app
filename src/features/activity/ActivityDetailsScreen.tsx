import Error from '@assets/svgs/error.svg'
import Receive from '@assets/svgs/receive.svg'
import Send from '@assets/svgs/send.svg'
import BackScreen from '@components/BackScreen'
import BlurActionSheet from '@components/BlurActionSheet'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import ImageBox from '@components/ImageBox'
import ListItem from '@components/ListItem'
import Text from '@components/Text'
import useCopyText from '@hooks/useCopyText'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import useHaptic from '@hooks/useHaptic'
import { RouteProp, useRoute } from '@react-navigation/native'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useColors } from '@config/theme/themeHooks'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import ScrollBox from '@components/ScrollBox'
import { useBottomSpacing } from '@hooks/useBottomSpacing'
import { useCreateExplorerUrl } from '../../utils/constants/urls'
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
          p="2"
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
          <Text textAlign="center" variant="textMdBold" color="error.500">
            {t('activityScreen.scamWarning')}
          </Text>
          <ButtonPressable
            title={t('activityScreen.showAnyway')}
            onPress={() => setDismissed(true)}
            borderRadius="full"
            borderColor="error.500"
            borderWidth={1}
            px="4"
            titleColorDisabled="gray.800"
            titleColor="error.500"
            fontWeight="500"
            marginTop="6"
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
  const bottomSpacing = useBottomSpacing()

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
      return <Error color={colors['error.500']} width={150} height={150} />
    }
    const userSignedTransaction =
      wallet && enrichedTx.signers?.includes(wallet.toBase58())

    const { tokenTransfers, events } = enrichedTx

    if (events?.compressed?.length) {
      const nft = events.compressed[0]

      if (!nft?.metadata.image) {
        return (
          <Box
            backgroundColor="cardBackground"
            borderRadius="4xl"
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
          borderRadius="4xl"
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
          borderRadius="4xl"
        />
      )
    }

    return userSignedTransaction ? (
      <Send color={colors['blue.500']} width={150} height={150} />
    ) : (
      <Receive color={colors['green.500']} width={150} height={150} />
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
      <Box marginTop="6" flex={1} width="100%" justifyContent="center">
        {fromAccount && (
          <AddressActivityItem
            accountAddress={fromAccount}
            marginHorizontal="6"
            marginBottom="xs"
            borderRadius="4xl"
            showBubbleArrow
            onMenuPress={onAddressItemPress(fromAccount)}
          />
        )}
        {toAccount && (
          <AddressActivityItem
            accountAddress={toAccount}
            marginHorizontal="6"
            borderRadius="4xl"
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
    <ScrollBox
      style={{ backgroundColor: colors.primaryBackground }}
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        backgroundColor: colors.primaryBackground,
      }}
    >
      <BackScreen
        title={t('activityScreen.activityDetails')}
        flex={1}
        edges={[]}
        headerTopMargin="6xl"
      >
        <Box alignItems="center" justifyContent="center" flex={1}>
          <Box justifyContent="center" alignItems="center" marginTop="4">
            {activityImage}
            <Text
              variant="displayMdMedium"
              marginTop="4"
              marginBottom="2"
              textAlign="center"
            >
              {title}
            </Text>
            <Text
              variant="textMdMedium"
              color="primaryText"
              marginBottom="2"
              textAlign="center"
            >
              {description}
            </Text>
            <Text
              variant="textXsRegular"
              textAlign="center"
              color="secondaryText"
            >
              {dateLabel}
            </Text>
          </Box>
          {AccountAddressListItems}
          <Box width="100%">
            <ButtonPressable
              marginTop="8"
              marginHorizontal="4"
              borderRadius="full"
              backgroundColor="primaryBackground"
              titleColorDisabled="gray.600"
              backgroundColorDisabled="base.white"
              backgroundColorDisabledOpacity={0.1}
              title={t('activityScreen.viewOnExplorer')}
              titleColor="base.black"
              onPress={handleOpenExplorer}
              style={{
                marginBottom: bottomSpacing,
              }}
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
    </ScrollBox>
  )
}

export default ActivityDetailsScreen
