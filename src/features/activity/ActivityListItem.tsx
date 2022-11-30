import React, { useMemo } from 'react'
import { ConfirmedSignatureInfo } from '@solana/web3.js'
import { useTranslation } from 'react-i18next'
import { EnrichedTransaction } from '../../types/solana'
import Text from '../../components/Text'
import Box from '../../components/Box'
import TouchableOpacityBox, {
  TouchableOpacityBoxProps,
} from '../../components/TouchableOpacityBox'
import { ellipsizeAddress, solAddressIsValid } from '../../utils/accountUtils'
import CheckmarkFilled from '../../assets/images/checkmarkFill.svg'
import Error from '../../assets/images/error.svg'
import { useColors } from '../../theme/themeHooks'

export type ActivityListItemProps = {
  transaction: EnrichedTransaction | ConfirmedSignatureInfo
  hasDivider?: boolean
} & TouchableOpacityBoxProps

const ActivityListItem = ({
  transaction,
  hasDivider,
  ...rest
}: ActivityListItemProps) => {
  const colors = useColors()
  const { t, i18n } = useTranslation()

  const title = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    // Check if transaction is a confirmed signature
    if (confirmedSig.err || !enrichedTx.type) {
      return ellipsizeAddress(confirmedSig.signature.toString())
    }

    const txKey = `activityScreen.enrichedTransactionTypes.${enrichedTx.type}`

    return i18n.exists(txKey)
      ? t(txKey)
      : t('activityScreen.enrichedTransactionTypes.UNKNOWN')
  }, [i18n, t, transaction])

  const subtitle = useMemo(() => {
    const enrichedTx = transaction as EnrichedTransaction
    const confirmedSig = transaction as ConfirmedSignatureInfo

    // Custom description that elipiizes the address
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

    if (confirmedSig.err) {
      return 'Error'
    }

    return 'Success'
  }, [transaction])

  const transactionFailed = useMemo(() => {
    const confirmedSig = transaction as ConfirmedSignatureInfo
    return !!confirmedSig.err
  }, [transaction])

  return (
    <TouchableOpacityBox
      backgroundColor="black700"
      flexDirection="row"
      padding="m"
      borderBottomWidth={hasDivider ? 1 : 0}
      borderBottomColor="black"
      {...rest}
    >
      {!transactionFailed ? (
        <CheckmarkFilled width={25} height={25} color={colors.greenBright500} />
      ) : (
        <Error width={25} height={25} color={colors.error} />
      )}
      <Box marginStart="s" flexGrow={1} flexBasis={0.5} justifyContent="center">
        <Text variant="body1">{title}</Text>
        <Text variant="body2" color="secondaryText">
          {subtitle || 'No description provided'}
        </Text>
      </Box>
    </TouchableOpacityBox>
  )
}

export default ActivityListItem
