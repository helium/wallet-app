import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useBN } from '@hooks/useBN'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useRentExempt } from '@hooks/useRentExempt'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import BN from 'bn.js'
import { getBasePriorityFee } from '@utils/walletApiV2'
import { useAsync } from 'react-async-hook'
import { WalletSignOptsCompact } from './walletSignBottomSheetTypes'

type IWalletSignBottomSheetCompactProps = WalletSignOptsCompact & {
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
  const { rentExempt } = useRentExempt()
  const [estimatedTotalSolByLamports, setEstimatedTotalSolByLamports] =
    useState(0)

  useAsync(async () => {
    let fees = 5000 / LAMPORTS_PER_SOL
    if (serializedTxs) {
      const basePriorityFee = await getBasePriorityFee()
      const priorityFees = serializedTxs.length * basePriorityFee
      fees = (serializedTxs.length * 5000 + priorityFees) / LAMPORTS_PER_SOL
    }

    setEstimatedTotalSolByLamports(fees)
  }, [serializedTxs, setEstimatedTotalSolByLamports])

  const insufficientRentExempt = useMemo(() => {
    if (solBalance) {
      return new BN(solBalance.toString())
        .sub(new BN(estimatedTotalSolByLamports))
        .lt(new BN(rentExempt || 0))
    }
  }, [solBalance, estimatedTotalSolByLamports, rentExempt])

  const insufficientFunds = useMemo(
    () =>
      new BN(estimatedTotalSolByLamports).gt(
        new BN(solBalance?.toString() || '0'),
      ),
    [solBalance, estimatedTotalSolByLamports],
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
        <Text variant="subtitle2" marginBottom="s">
          {header || t('transactions.signTxn')}
        </Text>
      )}

      {!(insufficientFunds || insufficientRentExempt) && (
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
          {`~${estimatedTotalSolByLamports} SOL`}
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
