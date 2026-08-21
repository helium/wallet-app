import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useBN } from '@hooks/useBN'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useRentExempt } from '@hooks/useRentExempt'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import BN from 'bn.js'
import { estimateTxnFeeLamports, TXN_FEE_IN_LAMPORTS } from '@utils/solanaUtils'
import { WalletSignOpts } from './walletSignBottomSheetTypes'

type IWalletSignBottomSheetCompactProps = WalletSignOpts & {
  onSimulate: () => void
  onCancel: () => void
  onAccept: () => void
}

export const WalletSignBottomSheetCompact = ({
  header,
  message,
  warning,
  serializedTxs,
  renderer,
  onSimulate,
  onCancel,
  onAccept,
}: IWalletSignBottomSheetCompactProps) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const { rentExempt, rentExemptLamports } = useRentExempt()

  const estimatedTotalLamports = useMemo(() => {
    if (!serializedTxs) return TXN_FEE_IN_LAMPORTS
    return serializedTxs.reduce(
      (total, tx) => total + estimateTxnFeeLamports(tx),
      0,
    )
  }, [serializedTxs])

  const insufficientRentExempt = useMemo(() => {
    if (solBalance) {
      return new BN(solBalance.toString())
        .sub(new BN(estimatedTotalLamports))
        .lt(new BN(rentExemptLamports || 0))
    }
  }, [solBalance, estimatedTotalLamports, rentExemptLamports])

  const insufficientFunds = useMemo(
    () =>
      new BN(estimatedTotalLamports).gt(new BN(solBalance?.toString() || '0')),
    [solBalance, estimatedTotalLamports],
  )

  return (
    <Box padding="m" marginBottom="m">
      {warning && (
        <Box
          borderRadius="l"
          backgroundColor="secondaryBackground"
          padding="m"
          marginBottom="m"
        >
          <Text variant="body1Medium" color="orange500">
            {warning}
          </Text>
        </Box>
      )}

      {!(insufficientFunds || insufficientRentExempt) && (
        <Text variant="subtitle2">{header || t('transactions.signTxn')}</Text>
      )}

      {!(insufficientFunds || insufficientRentExempt) && message && (
        <Text variant="body1Medium" color="secondaryText">
          {message}
        </Text>
      )}

      {(insufficientFunds || insufficientRentExempt) && (
        <Box
          borderRadius="l"
          backgroundColor="secondaryBackground"
          padding="m"
          marginTop="m"
        >
          <Text variant="body1Medium" color="red500">
            {insufficientFunds
              ? t('browserScreen.insufficientFunds')
              : t('browserScreen.insufficientRentExempt', {
                  amount: rentExempt,
                })}
          </Text>
        </Box>
      )}
      {renderer && renderer()}
      <Box marginTop="m" flexDirection="row">
        <Box flexGrow={1}>
          <Text variant="body1Bold">{t('browserScreen.totalNetworkFee')}</Text>
        </Box>
        <Text variant="body1Medium" color="blue500">
          {`~${estimatedTotalLamports / LAMPORTS_PER_SOL} SOL`}
        </Text>
      </Box>
      <Box alignItems="center" py="l">
        <TouchableOpacity onPress={onSimulate}>
          <Text variant="body1" color="secondaryText">
            {t('transactions.simulateTxn')}
          </Text>
        </TouchableOpacity>
      </Box>
      <Box flexDirection="row" justifyContent="space-between">
        <ButtonPressable
          width="48%"
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacity={0.1}
          backgroundColorOpacityPressed={0.05}
          titleColorPressedOpacity={0.3}
          titleColor="white"
          title={t('browserScreen.cancel')}
          onPress={onCancel}
        />
        <ButtonPressable
          width="48%"
          borderRadius="round"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="surfaceSecondary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="secondaryText"
          title={t('browserScreen.approve')}
          titleColor="black"
          onPress={onAccept}
        />
      </Box>
    </Box>
  )
}
