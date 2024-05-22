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
      backgroundColor="surfaceSecondary"
      flexDirection="row"
      alignItems="center"
      padding="m"
      borderBottomWidth={hasDivider ? 1 : 0}
      borderBottomColor="black"
      {...rest}
    >
      {!transactionFailed ? (
        userSignedTransaction ? (
          <Send width={25} height={25} color={colors.green500} />
        ) : (
          <Receive width={25} height={25} color={colors.blue500} />
        )
      ) : (
        <Error width={25} height={25} color={colors.error} />
      )}
      <Box marginStart="s" flexGrow={1} flexBasis={0.5} justifyContent="center">
        <Text variant="subtitle4">{title}</Text>
        <Text variant="body3" color="secondaryText">
          {subtitle}
        </Text>
      </Box>
    </TouchableContainer>
  )
}

export default ActivityListItem
