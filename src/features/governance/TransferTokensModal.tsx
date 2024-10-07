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
          padding="4"
          marginHorizontal="2"
        >
          <ScrollView>
            <Box flexGrow={1} justifyContent="center">
              <Text
                textAlign="left"
                variant="textLgMedium"
                adjustsFontSizeToFit
              >
                {t('gov.transactions.transferPosition')}
              </Text>
              <Text
                variant="textSmMedium"
                color="secondaryText"
                marginBottom="4"
              >
                {t('gov.positions.transferBlurb')}
              </Text>
              <Box
                borderRadius="2xl"
                backgroundColor="secondaryBackground"
                padding="4"
                marginBottom="4"
              >
                <Text variant="textXsRegular">
                  {t('gov.positions.transferWarning')}
                </Text>
                {!hasTransferablePositions ? (
                  <Text
                    marginTop="4"
                    variant="textXsRegular"
                    color="orange.500"
                  >
                    {t('gov.positions.cantTransfer')}
                  </Text>
                ) : (
                  <Text marginTop="4" variant="textXsRegular">
                    {t('gov.positions.transferLandrushWarning')}
                  </Text>
                )}
              </Box>
              {hasTransferablePositions && (
                <>
                  <Box backgroundColor="secondaryBackground" borderRadius="2xl">
                    <TouchableOpacityBox
                      paddingHorizontal="4"
                      paddingVertical="6"
                      onPress={handleAmountPressed}
                    >
                      <Text variant="textSmMedium" color="gray.600">
                        {t('gov.positions.amountToTransfer')}
                      </Text>
                      <Text
                        variant="textMdRegular"
                        fontWeight="400"
                        color="gray.600"
                      >
                        {amount || 'Amount (tokens)'}
                      </Text>
                    </TouchableOpacityBox>
                  </Box>
                  <Box justifyContent="center" marginTop="4">
                    <Text
                      variant="textSmMedium"
                      color="secondaryText"
                      marginBottom="4"
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
                        marginTop={idx > 0 ? '4' : 'none'}
                        flex={1}
                        borderRadius="2xl"
                        backgroundColor={
                          isSelected ? 'secondaryBackground' : 'bg.tertiary'
                        }
                        onPress={() => setSelectedPosPk(pos.pubkey)}
                      >
                        <Box
                          flex={1}
                          flexDirection="row"
                          padding="4"
                          justifyContent="space-between"
                        >
                          <Box
                            flex={1}
                            flexShrink={0}
                            flexDirection="row"
                            justifyContent="center"
                          >
                            <Box flex={1}>
                              <Text
                                variant="textSmRegular"
                                color="secondaryText"
                              >
                                {t('gov.positions.lockupType')}
                              </Text>
                              <Text variant="textSmRegular" color="primaryText">
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
                              <Text
                                variant="textSmRegular"
                                color="secondaryText"
                              >
                                {t('gov.positions.voteMult')}
                              </Text>
                              <Text variant="textSmRegular" color="primaryText">
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
                            </Box>
                          </Box>
                          <Box flex={1} flexShrink={0} flexDirection="row">
                            <Box flex={1}>
                              <Text
                                variant="textSmRegular"
                                color="secondaryText"
                              >
                                {isConstant ? 'Min. Duration' : 'Time left'}
                              </Text>
                              <Text variant="textSmRegular" color="primaryText">
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
                          borderTopColor="gray.true-700"
                          borderTopWidth={1}
                          paddingVertical="2"
                          paddingHorizontal="4"
                        >
                          <Text variant="textSmRegular" color="primaryText">
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
                paddingTop="4"
              >
                <Text variant="textXsMedium" color="error.500">
                  {showError}
                </Text>
              </Box>
            )}
          </ScrollView>
          <Box flexDirection="row" paddingTop="4">
            <ButtonPressable
              flex={1}
              fontSize={16}
              borderRadius="full"
              backgroundColor="base.white"
              backgroundColorOpacityPressed={0.7}
              backgroundColorDisabled="bg.tertiary"
              backgroundColorDisabledOpacity={0.9}
              titleColorDisabled="secondaryText"
              title={isSubmitting ? '' : t('gov.transactions.transferPosition')}
              titleColor="base.black"
              onPress={handleSubmit}
              disabled={!amount || !selectedPosPk || isSubmitting}
              TrailingComponent={
                isSubmitting ? <CircleLoader color="primaryText" /> : undefined
              }
            />
          </Box>
        </BackScreen>
      </ReAnimatedBlurBox>
      <HNTKeyboard
        ref={hntKeyboardRef}
        mint={mint}
        networkFee={SOL_TXN_FEE}
        actionableAmount={
          maxTransferAmount && mintAcc
            ? toBN(maxTransferAmount, mintAcc.decimals)
            : undefined
        }
        onConfirmBalance={handleAmountChange}
      />
    </Portal>
  )
}
