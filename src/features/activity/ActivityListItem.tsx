import Send from '@assets/images/send.svg'
import Receive from '@assets/images/receive.svg'
import Error from '@assets/images/error.svg'
import Box from '@components/Box'
import Text from '@components/Text'
import TouchableContainer from '@components/TouchableContainer'
import { TouchableOpacityBoxProps } from '@components/TouchableOpacityBox'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useColors } from '@theme/themeHooks'
import { ellipsizeAddress, solAddressIsValid } from '@utils/accountUtils'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Insets } from 'react-native'
import { EnrichedTransaction } from '../../types/solana'

export type ActivityListItemProps = {
  transaction: EnrichedTransaction | ConfirmedSignatureInfo
  hasDivider?: boolean
  hitSlop?: Insets
} & TouchableOpacityBoxProps

const ActivityListItem = ({
  transaction,
  hasDivider,
  ...rest
}: ActivityListItemProps) => {
  const colors = useColors()
  const { t, i18n } = useTranslation()

  const wallet = useCurrentWallet()

  const title = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    // Check if transaction is a confirmed signature
    if (enrichedTx.transactionError || confirmedSig.err || !enrichedTx.type) {
      return ellipsizeAddress(
        enrichedTx?.signature?.toString() ||
          confirmedSig?.signature?.toString(),
      )
    }

    const txKey = `activityScreen.enrichedTransactionTypes.${enrichedTx.type}`

    return i18n.exists(txKey)
      ? t(txKey)
      : t('activityScreen.enrichedTransactionTypes.UNKNOWN')
  }, [i18n, t, transaction])

  const subtitle = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    // Custom description that ellipsizes the address
    if (enrichedTx.description) {
      const customDescription = enrichedTx.description
        ?.split(' ')
        .map((word) => {
          // TODO: Figure out why some addresses are not valid
          if (solAddressIsValid(word)) {
            return ellipsizeAddress(word, {
              numChars: 4,
            })
          }
          return word
        })
        .join(' ')

      return customDescription
    }

    if (enrichedTx.transactionError || confirmedSig.err) {
      return t('generic.error')
    }

    return t('generic.success')
  }, [t, transaction])

  const transactionFailed = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo
    return !!confirmedSig?.err || !!enrichedTx.transactionError
  }, [transaction])

  const userSignedTransaction = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    if (wallet && enrichedTx.signers) {
      return enrichedTx.signers?.includes(wallet?.toBase58())
    }

    return false
  }, [transaction, wallet])

  return (
    <TouchableContainer
      backgroundColor="cardBackground"
      flexDirection="row"
      alignItems="center"
      padding="4"
      borderBottomWidth={hasDivider ? 2 : 0}
      borderBottomColor="primaryBackground"
      {...rest}
    >
      {!transactionFailed ? (
        userSignedTransaction ? (
          <Send width={20} height={20} color={colors['green.500']} />
        ) : (
          <Receive width={20} height={20} color={colors['blue.500']} />
        )
      ) : (
        <Error width={20} height={20} color={colors['error.500']} />
      )}
      <Box marginStart="2" flexGrow={1} flexBasis={0.5} justifyContent="center">
        <Text variant="textSmMedium">{title}</Text>
        <Text variant="textXsRegular" color="secondaryText">
          {subtitle}
        </Text>
      </Box>
    </TouchableContainer>
  )
}

export default ActivityListItem
