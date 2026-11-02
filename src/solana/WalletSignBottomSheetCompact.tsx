import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useCurrentWallet } from '@hooks/useCurrentWallet'
import { useBN } from '@hooks/useBN'
import { useSolOwnedAmount } from '@helium/helium-react-hooks'
import { useRentExempt } from '@hooks/useRentExempt'
import BN from 'bn.js'
import { humanReadable } from '@utils/formatting'
import { estimateTxnFeeLamports, TXN_FEE_IN_LAMPORTS } from '@utils/solanaUtils'
import { WalletSignOpts } from './walletSignBottomSheetTypes'

type IWalletSignBottomSheetCompactProps = WalletSignOpts & {
  // The sheet's open animation has ended
  opened: boolean
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
  opened,
  onSimulate,
  onCancel,
  onAccept,
}: IWalletSignBottomSheetCompactProps) => {
  const { t } = useTranslation()
  const wallet = useCurrentWallet()
  const solBalance = useBN(useSolOwnedAmount(wallet).amount)
  const { rentExempt, rentExemptLamports } = useRentExempt()

  const estimatedTotalLamports = serializedTxs
    ? serializedTxs.reduce((total, tx) => total + estimateTxnFeeLamports(tx), 0)
    : TXN_FEE_IN_LAMPORTS

  const insufficientRentExempt =
    solBalance &&
    new BN(solBalance.toString())
      .sub(new BN(estimatedTotalLamports))
      .lt(new BN(rentExemptLamports))

  const insufficientFunds = new BN(estimatedTotalLamports).gt(
    new BN(solBalance?.toString() || '0'),
  )

  return (
    <View className="mb-4 p-4">
      {warning && (
        <View className="mb-4 rounded-[12px] bg-warning-100 p-4">
          <Text size="base" className="font-medium">
            {warning}
          </Text>
        </View>
      )}

      <Text size="lg" className="font-medium">
        {header || t('transactions.signTxn')}
      </Text>

      {message && (
        <Text size="base" className="font-medium text-muted-foreground">
          {message}
        </Text>
      )}

      {(insufficientFunds || insufficientRentExempt) && (
        <View className="mt-4 rounded-[12px] bg-secondary p-4">
          <Text size="base" className="font-medium text-destructive">
            {insufficientFunds
              ? t('browserScreen.insufficientFunds')
              : t('browserScreen.insufficientRentExempt', {
                  amount: rentExempt,
                })}
          </Text>
        </View>
      )}
      {renderer && renderer()}
      <View className="mt-4 flex-row">
        <View className="grow">
          <Text size="base" className="font-bold">
            {t('browserScreen.totalNetworkFee')}
          </Text>
        </View>
        <Text size="base" className="font-medium text-blue-dark-500">
          {`~${humanReadable(new BN(estimatedTotalLamports), 9)} SOL`}
        </Text>
      </View>
      <View className="items-center py-6">
        <PressableScale feedback="opacity" onPress={onSimulate}>
          <Text size="base" className="text-muted-foreground">
            {t('transactions.simulateTxn')}
          </Text>
        </PressableScale>
      </View>
      <View className="flex-row gap-2">
        <Button
          variant="outline"
          size="lg"
          className="flex-1"
          onPress={onCancel}
          testID="WalletSign.Cancel"
        >
          {t('browserScreen.cancel')}
        </Button>
        <Button
          variant="cta"
          size="lg"
          className="flex-1"
          onPress={onAccept}
          disabled={!opened}
          testID="WalletSign.Approve"
        >
          {t('browserScreen.approve')}
        </Button>
      </View>
    </View>
  )
}
