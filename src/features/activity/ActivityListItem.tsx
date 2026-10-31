import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { PressableScale, PressableScaleProps } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import { ellipsizeAddress, solAddressIsValid } from '@utils/accountUtils'
import { ArrowDownLeft, ArrowUpRight, CircleX } from 'lucide-react-native'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { withUniwind } from 'uniwind'
import { EnrichedTransaction } from '../../types/solana'

const SendIcon = withUniwind(ArrowUpRight)
const ReceiveIcon = withUniwind(ArrowDownLeft)
const ErrorIcon = withUniwind(CircleX)

export type ActivityListItemProps = {
  transaction: EnrichedTransaction | ConfirmedSignatureInfo
  hasDivider?: boolean
} & Omit<PressableScaleProps, 'children'>

const ActivityListItem = ({
  transaction,
  hasDivider,
  className,
  ...rest
}: ActivityListItemProps) => {
  const { t, i18n } = useTranslation()

  const wallet = useCurrentWallet()

  const enrichedTx = transaction as EnrichedTransaction
  const confirmedSig = transaction as ConfirmedSignatureInfo

  const title = (() => {
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
  })()

  const subtitle = (() => {
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
  })()

  const transactionFailed = !!confirmedSig?.err || !!enrichedTx.transactionError

  const userSignedTransaction =
    wallet && enrichedTx.signers
      ? enrichedTx.signers.includes(wallet.toBase58())
      : false

  return (
    <PressableScale
      feedback="opacity"
      className={twMerge(
        'flex-row items-center bg-secondary p-4',
        hasDivider && 'border-b border-border',
        className,
      )}
      {...rest}
    >
      {!transactionFailed ? (
        userSignedTransaction ? (
          <SendIcon size={24} colorClassName="accent-success-500" />
        ) : (
          <ReceiveIcon size={24} colorClassName="accent-blue-dark-500" />
        )
      ) : (
        <ErrorIcon size={24} colorClassName="accent-destructive" />
      )}
      <View className="ml-2 flex-1 justify-center">
        <Text className="font-medium">{title}</Text>
        <Text size="xs" className="text-muted-foreground">
          {subtitle}
        </Text>
      </View>
    </PressableScale>
  )
}

export default ActivityListItem
