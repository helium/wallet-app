import React, { useRef, useState } from 'react'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import { useMint, useSolanaUnixNow } from '@helium/helium-react-hooks'
import { getMintMinAmountAsDecimal, precision } from '@utils/formatting'
import { Keyboard, ScrollView, View } from 'react-native'
import { HNTKeyboard, type HNTKeyboardRef } from '@ui/HNTKeyboard'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import BN from 'bn.js'
import { humanReadable, toBN, toNumber } from '@helium/spl-utils'
import { TXN_FEE_IN_LAMPORTS } from '@utils/solanaUtils'
import { getMinDurationFmt, getTimeLeftFromNowFmt } from '@utils/dateTools'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useTranslation } from 'react-i18next'
import { Button } from '@ui/Button'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { GovernanceModal } from './components/GovernanceModal'

const SOL_TXN_FEE = new BN(TXN_FEE_IN_LAMPORTS)
export const TransferTokensModal = ({
  mint,
  positions,
  maxTransferAmount,
  onClose,
  onSubmit,
}: {
  mint: PublicKey
  positions: PositionWithMeta[]
  maxTransferAmount: number
  onClose: () => void
  onSubmit: (position: PositionWithMeta, amount: number) => Promise<void>
}) => {
  const { t } = useTranslation()
  const unixNow = useSolanaUnixNow(60 * 5 * 1000) || 0
  const { currentAccount } = useAccountStorage()
  const { info: mintAcc } = useMint(mint)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [transactionError, setTransactionError] = useState()
  const [amount, setAmount] = useState<number | undefined>()
  const [selectedPosPk, setSelectedPosPk] = useState<PublicKey | undefined>()
  const mintMinAmount = mintAcc ? getMintMinAmountAsDecimal(mintAcc) : 1
  const currentPrecision = precision(mintMinAmount)
  const { symbol } = useMetaplexMetadata(mint)
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)

  const handleAmountPressed = () => {
    Keyboard.dismiss()
    hntKeyboardRef.current?.show({
      payer: currentAccount,
    })
  }

  const handleAmountChange = ({ balance }: { balance: BN }) => {
    if (balance.eq(new BN(0)) || !mintAcc) {
      setAmount(undefined)
    } else {
      setAmount(
        parseFloat(
          Math.max(
            mintMinAmount,
            Math.min(maxTransferAmount, toNumber(balance, mintAcc?.decimals)),
          ).toFixed(currentPrecision),
        ),
      )
    }
  }

  const handleOnClose = () => {
    onClose()
  }

  const handleSubmit = async () => {
    if (amount && selectedPosPk) {
      try {
        setIsSubmitting(true)
        await onSubmit(
          positions.find((pos) => pos.pubkey.equals(selectedPosPk))!,
          amount,
        )

        onClose()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setIsSubmitting(false)
        setTransactionError(e.message || t('gov.errors.transferPosition'))
      }
    }
  }

  const showError = transactionError

  const hasTransferablePositions = positions.length > 0

  return (
    <GovernanceModal onClose={handleOnClose}>
      <HNTKeyboard
        usePortal
        ref={hntKeyboardRef}
        mint={mint}
        networkFee={SOL_TXN_FEE}
        actionableAmount={
          maxTransferAmount && mintAcc
            ? toBN(maxTransferAmount, mintAcc.decimals)
            : undefined
        }
        onConfirmBalance={handleAmountChange}
      >
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          <View className="grow justify-center">
            <Text size="xl" className="font-semibold" adjustsFontSizeToFit>
              {t('gov.transactions.transferPosition')}
            </Text>
            <Text className="mb-4 text-muted-foreground">
              {t('gov.positions.transferBlurb')}
            </Text>
            <View className="mb-4 rounded-[12px] bg-card p-4">
              <Text size="xs">{t('gov.positions.transferWarning')}</Text>
              {!hasTransferablePositions ? (
                <Text size="xs" className="mt-4 text-warning-500">
                  {t('gov.positions.cantTransfer')}
                </Text>
              ) : (
                <Text size="xs" className="mt-4">
                  {t('gov.positions.transferLandrushWarning')}
                </Text>
              )}
            </View>
            {hasTransferablePositions && (
              <>
                <View className="rounded-[12px] bg-card">
                  <PressableScale
                    feedback="opacity"
                    className="px-4 py-6"
                    onPress={handleAmountPressed}
                  >
                    <Text className="text-muted-foreground">
                      {t('gov.positions.amountToTransfer')}
                    </Text>
                    <Text size="base" className="text-muted-foreground">
                      {amount || 'Amount (tokens)'}
                    </Text>
                  </PressableScale>
                </View>
                <View className="mt-4 justify-center">
                  <Text className="mb-4 text-muted-foreground">
                    {t('gov.positions.selectTransfer')}
                  </Text>
                </View>
                {positions.map((pos, idx) => {
                  const { lockup } = pos
                  const lockupKind = Object.keys(lockup.kind)[0] as string
                  const isConstant = lockupKind === 'constant'
                  const isSelected = selectedPosPk?.equals(pos.pubkey)

                  return (
                    <PressableScale
                      key={pos.pubkey.toString()}
                      feedback="opacity"
                      className={`flex-1 rounded-[12px] ${
                        idx > 0 ? 'mt-4' : ''
                      } ${isSelected ? 'bg-secondary' : 'bg-card'}`}
                      onPress={() => setSelectedPosPk(pos.pubkey)}
                    >
                      <View className="flex-1 flex-row justify-between p-4">
                        <View className="flex-1 shrink-0 flex-row justify-center">
                          <View className="flex-1">
                            <Text className="text-muted-foreground">
                              {t('gov.positions.lockupType')}
                            </Text>
                            <Text>{isConstant ? 'Constant' : 'Decaying'}</Text>
                          </View>
                        </View>
                        <View className="flex-1 shrink-0 flex-row justify-center">
                          <View className="flex-1">
                            <Text className="text-muted-foreground">
                              {t('gov.positions.voteMult')}
                            </Text>
                            <Text>
                              {(
                                (pos.votingPower.isZero()
                                  ? 0
                                  : // Mul by 100 to get 2 decimal places
                                    pos.votingPower
                                      .mul(new BN(100))
                                      .div(pos.amountDepositedNative)
                                      .toNumber() / 100) /
                                (pos.genesisEnd.gt(new BN(unixNow))
                                  ? pos.votingMint.genesisVotePowerMultiplier
                                  : 1)
                              ).toFixed(2)}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-1 shrink-0 flex-row">
                          <View className="flex-1">
                            <Text className="text-muted-foreground">
                              {isConstant ? 'Min. Duration' : 'Time left'}
                            </Text>
                            <Text>
                              {isConstant
                                ? getMinDurationFmt(
                                    pos.lockup.startTs,
                                    pos.lockup.endTs,
                                  )
                                : getTimeLeftFromNowFmt(pos.lockup.endTs)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View className="border-t border-border px-4 py-2">
                        <Text>
                          {t('gov.positions.lockedAmount', {
                            amount:
                              mintAcc &&
                              humanReadable(
                                new BN(pos.amountDepositedNative),
                                mintAcc.decimals,
                              ),
                            symbol,
                          })}
                        </Text>
                      </View>
                    </PressableScale>
                  )
                })}
              </>
            )}
          </View>
          {showError && (
            <View className="flex-row items-center justify-center pt-4">
              <Text size="xs" className="font-medium text-destructive">
                {showError}
              </Text>
            </View>
          )}
        </ScrollView>
        <View className="flex-row pt-4">
          <Button
            variant="cta"
            size="dashboard"
            className="flex-1"
            onPress={() => void handleSubmit().catch(console.error)}
            disabled={!amount || !selectedPosPk || isSubmitting}
          >
            {isSubmitting ? (
              <Spinner colorClassName="accent-white" />
            ) : (
              t('gov.transactions.transferPosition')
            )}
          </Button>
        </View>
      </HNTKeyboard>
    </GovernanceModal>
  )
}
