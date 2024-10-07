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
    <Box padding="4" marginBottom="4">
      {warning && (
        <Box
          borderRadius="2xl"
          backgroundColor="secondaryBackground"
          padding="4"
          marginBottom="4"
        >
          <Text variant="textMdMedium" color="orange.500">
            {warning}
          </Text>
        </Box>
      )}

      {!(insufficientFunds || insufficientRentExempt) && (
        <Text variant="textLgMedium">
          {header || t('transactions.signTxn')}
        </Text>
      )}

      {!(insufficientFunds || insufficientRentExempt) && message && (
        <Text variant="textMdMedium" color="secondaryText">
          {message}
        </Text>
      )}

      {(insufficientFunds || insufficientRentExempt) && (
        <Box
          borderRadius="2xl"
          backgroundColor="secondaryBackground"
          padding="4"
          marginTop="4"
        >
          <Text variant="textMdMedium" color="error.500">
            {insufficientFunds
              ? t('browserScreen.insufficientFunds')
              : t('browserScreen.insufficientRentExempt', {
                  amount: rentExempt,
                })}
          </Text>
        </Box>
      )}
      {renderer && renderer()}
      <Box marginTop="4" flexDirection="row">
        <Box flexGrow={1}>
          <Text variant="textMdBold">{t('browserScreen.totalNetworkFee')}</Text>
        </Box>
        <Text variant="textMdMedium" color="blue.500">
          {`~${estimatedTotalSolByLamports} SOL`}
        </Text>
      </Box>
      <Box alignItems="center" py="6">
        <TouchableOpacity onPress={onSimulate}>
          <Text variant="textMdRegular" color="secondaryText">
            {t('transactions.simulateTxn')}
          </Text>
        </TouchableOpacity>
      </Box>
      <Box flexDirection="row" justifyContent="space-between">
        <ButtonPressable
          width="48%"
          borderRadius="full"
          backgroundColor="base.white"
          backgroundColorOpacity={0.1}
          backgroundColorOpacityPressed={0.05}
          titleColorPressedOpacity={0.3}
          titleColor="base.white"
          title={t('browserScreen.cancel')}
          onPress={onCancel}
        />
        <ButtonPressable
          width="48%"
          borderRadius="full"
          backgroundColor="base.white"
          backgroundColorOpacityPressed={0.7}
          backgroundColorDisabled="bg.tertiary"
          backgroundColorDisabledOpacity={0.5}
          titleColorDisabled="secondaryText"
          title={t('browserScreen.approve')}
          titleColor="base.black"
          onPress={onAccept}
        />
      </Box>
    </Box>
  )
}
