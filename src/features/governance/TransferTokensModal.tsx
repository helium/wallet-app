import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import { FadeInFast } from '@components/FadeInOut'
import { Portal } from '@gorhom/portal'
import React, { useMemo, useRef, useState } from 'react'
import Text from '@components/Text'
import Box from '@components/Box'
import { Edge } from 'react-native-safe-area-context'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import { useMint, useSolanaUnixNow } from '@helium/helium-react-hooks'
import { getMintMinAmountAsDecimal, precision } from '@utils/formatting'
import { Keyboard, ScrollView } from 'react-native'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import BN from 'bn.js'
import { humanReadable, toBN, toNumber } from '@helium/spl-utils'
import CircleLoader from '@components/CircleLoader'
import ButtonPressable from '@components/ButtonPressable'
import { TXN_FEE_IN_LAMPORTS } from '@utils/solanaUtils'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { getMinDurationFmt, getTimeLeftFromNowFmt } from '@utils/dateTools'
import { useMetaplexMetadata } from '@hooks/useMetaplexMetadata'
import { useTranslation } from 'react-i18next'

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
  const backEdges = useMemo(() => ['top'] as Edge[], [])
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
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          positions.find((pos) => pos.pubkey.equals(selectedPosPk))!,
          amount,
        )

        onClose()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setIsSubmitting(false)
        setTransactionError(e.message || t('gov.errors.transferPosition'))
      }

      // error handling on postiion card
      onClose()
    }
  }

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

  const hasTransferablePositions = positions.length > 0

  return (
    <Portal hostName="GovernancePortalHost">
      <ReAnimatedBlurBox
        visible
        entering={FadeInFast}
        position="absolute"
        height="100%"
        width="100%"
      >
        <BackScreen
          hideBack
          edges={backEdges}
          onClose={handleOnClose}
          backgroundColor="transparent"
          flex={1}
          padding="m"
          marginHorizontal="s"
        >
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
            <ScrollView>
              <Box flexGrow={1} justifyContent="center">
                <Text textAlign="left" variant="subtitle2" adjustsFontSizeToFit>
                  {t('gov.transactions.transferPosition')}
                </Text>
                <Text
                  variant="subtitle4"
                  color="secondaryText"
                  marginBottom="m"
                >
                  {t('gov.positions.transferBlurb')}
                </Text>
                <Box
                  borderRadius="l"
                  backgroundColor="secondary"
                  padding="m"
                  marginBottom="m"
                >
                  <Text variant="body3">
                    {t('gov.positions.transferWarning')}
                  </Text>
                  {!hasTransferablePositions ? (
                    <Text marginTop="m" variant="body3" color="flamenco">
                      {t('gov.positions.cantTransfer')}
                    </Text>
                  ) : (
                    <Text marginTop="m" variant="body3">
                      {t('gov.positions.transferLandrushWarning')}
                    </Text>
                  )}
                </Box>
                {hasTransferablePositions && (
                  <>
                    <Box backgroundColor="secondary" borderRadius="l">
                      <TouchableOpacityBox
                        paddingHorizontal="m"
                        paddingVertical="l"
                        onPress={handleAmountPressed}
                      >
                        <Text variant="subtitle4" color="grey600">
                          {t('gov.positions.amountToTransfer')}
                        </Text>
                        <Text variant="body1" fontWeight="400" color="grey600">
                          {amount || 'Amount (tokens)'}
                        </Text>
                      </TouchableOpacityBox>
                    </Box>
                    <Box justifyContent="center" marginTop="m">
                      <Text
                        variant="subtitle4"
                        color="secondaryText"
                        marginBottom="m"
                      >
                        {t('gov.positions.selectTransfer')}
                      </Text>
                    </Box>
                    {positions.map((pos, idx) => {
                      const { lockup } = pos
                      const lockupKind = Object.keys(lockup.kind)[0] as string
                      const isConstant = lockupKind === 'constant'
                      const isSelected = selectedPosPk?.equals(pos.pubkey)

                      return (
                        <TouchableOpacityBox
                          key={pos.pubkey.toString()}
                          marginTop={idx > 0 ? 'm' : 'none'}
                          flex={1}
                          borderRadius="l"
                          backgroundColor={
                            isSelected ? 'secondaryBackground' : 'secondary'
                          }
                          onPress={() => setSelectedPosPk(pos.pubkey)}
                        >
                          <Box
                            flex={1}
                            flexDirection="row"
                            padding="m"
                            justifyContent="space-between"
                          >
                            <Box
                              flex={1}
                              flexShrink={0}
                              flexDirection="row"
                              justifyContent="center"
                            >
                              <Box flex={1}>
                                <Text variant="body2" color="secondaryText">
                                  {t('gov.positions.lockupType')}
                                </Text>
                                <Text variant="body2" color="primaryText">
                                  {isConstant ? 'Constant' : 'Decaying'}
                                </Text>
                              </Box>
                            </Box>
                            <Box
                              flex={1}
                              flexShrink={0}
                              flexDirection="row"
                              justifyContent="center"
                            >
                              <Box flex={1}>
                                <Text variant="body2" color="secondaryText">
                                  {t('gov.positions.voteMult')}
                                </Text>
                                <Text variant="body2" color="primaryText">
                                  {(
                                    (pos.votingPower.isZero()
                                      ? 0
                                      : // Mul by 100 to get 2 decimal places
                                        pos.votingPower
                                          .mul(new BN(100))
                                          .div(pos.amountDepositedNative)
                                          .toNumber() / 100) /
                                    (pos.genesisEnd.gt(new BN(unixNow))
                                      ? pos.votingMint
                                          .genesisVotePowerMultiplier
                                      : 1)
                                  ).toFixed(2)}
                                </Text>
                              </Box>
                            </Box>
                            <Box flex={1} flexShrink={0} flexDirection="row">
                              <Box flex={1}>
                                <Text variant="body2" color="secondaryText">
                                  {isConstant ? 'Min. Duration' : 'Time left'}
                                </Text>
                                <Text variant="body2" color="primaryText">
                                  {isConstant
                                    ? getMinDurationFmt(
                                        pos.lockup.startTs,
                                        pos.lockup.endTs,
                                      )
                                    : getTimeLeftFromNowFmt(pos.lockup.endTs)}
                                </Text>
                              </Box>
                            </Box>
                          </Box>
                          <Box
                            borderTopColor="black200"
                            borderTopWidth={1}
                            paddingVertical="s"
                            paddingHorizontal="m"
                          >
                            <Text variant="body2" color="primaryText">
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
                          </Box>
                        </TouchableOpacityBox>
                      )
                    })}
                  </>
                )}
              </Box>
              {showError && (
                <Box
                  flexDirection="row"
                  justifyContent="center"
                  alignItems="center"
                  paddingTop="m"
                >
                  <Text variant="body3Medium" color="red500">
                    {showError}
                  </Text>
                </Box>
              )}
            </ScrollView>
            <Box flexDirection="row" paddingTop="m">
              <ButtonPressable
                flex={1}
                fontSize={16}
                borderRadius="round"
                backgroundColor="white"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="surfaceSecondary"
                backgroundColorDisabledOpacity={0.9}
                titleColorDisabled="secondaryText"
                title={
                  isSubmitting ? '' : t('gov.transactions.transferPosition')
                }
                titleColor="black"
                onPress={handleSubmit}
                disabled={!amount || !selectedPosPk || isSubmitting}
                TrailingComponent={
                  isSubmitting ? <CircleLoader color="white" /> : undefined
                }
              />
            </Box>
          </HNTKeyboard>
        </BackScreen>
      </ReAnimatedBlurBox>
    </Portal>
  )
}
