import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import { FadeInFast } from '@components/FadeInOut'
import { Portal } from '@gorhom/portal'
import React, { useMemo, useRef, useState } from 'react'
import Text from '@components/Text'
import SafeAreaBox from '@components/SafeAreaBox'
import Box from '@components/Box'
import { Edge } from 'react-native-safe-area-context'
import { PositionWithMeta } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import { useMint, useSolanaUnixNow } from '@helium/helium-react-hooks'
import { getMintMinAmountAsDecimal, precision } from '@utils/formatting'
import {
  Keyboard,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native'
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
  const unixNow = useSolanaUnixNow(60 * 5 * 1000) || 0
  const { currentAccount } = useAccountStorage()
  const { info: mintAcc } = useMint(mint)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [amount, setAmount] = useState<number | undefined>()
  const [selectedPosPk, setSelectedPosPk] = useState<PublicKey | undefined>()
  const mintMinAmount = mintAcc ? getMintMinAmountAsDecimal(mintAcc) : 1
  const currentPrecision = precision(mintMinAmount)
  const { symbol } = useMetaplexMetadata(mint)
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
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
        console.error('Unable to transfer tokens', e.message)
      }
    }
  }

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
          padding="none"
          hideBack
          edges={backEdges}
          onClose={handleOnClose}
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
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <ScrollView>
                  <SafeAreaBox
                    edges={safeEdges}
                    backgroundColor="transparent"
                    flex={1}
                    padding="m"
                    marginHorizontal="s"
                    marginVertical="xs"
                  >
                    <Box flexGrow={1} justifyContent="center">
                      <Text
                        textAlign="left"
                        variant="subtitle2"
                        adjustsFontSizeToFit
                      >
                        Transfer Tokens
                      </Text>
                      <Text
                        variant="subtitle4"
                        color="secondaryText"
                        marginBottom="m"
                      >
                        Move tokens from this position to another.
                      </Text>
                      <Box
                        borderRadius="l"
                        backgroundColor="secondary"
                        padding="ms"
                        marginBottom="m"
                      >
                        <Text variant="body3">
                          You can only transfer to positions that have a greater
                          than or equal lockup time.
                        </Text>
                        <Text marginTop="m" variant="body3">
                          {hasTransferablePositions
                            ? 'Transfering out of a Landrush position, will result in losing the multiplier!'
                            : 'There are no positions that meet this criteria.'}
                        </Text>
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
                                Amount to transfer
                              </Text>
                              <Text
                                fontSize={19}
                                fontWeight="400"
                                color="grey600"
                              >
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
                              Select position to transfer too.
                            </Text>
                          </Box>

                          {positions.map((pos, idx) => {
                            const { lockup } = pos
                            const lockupKind = Object.keys(
                              lockup.kind,
                            )[0] as string
                            const isConstant = lockupKind === 'constant'
                            const isSelected = selectedPosPk?.equals(pos.pubkey)

                            return (
                              <TouchableOpacityBox
                                key={pos.pubkey.toString()}
                                flex={1}
                                marginTop={idx === 0 ? 'none' : 'm'}
                                borderRadius="l"
                                backgroundColor={
                                  isSelected
                                    ? 'secondaryBackground'
                                    : 'secondary'
                                }
                                onPress={() => setSelectedPosPk(pos.pubkey)}
                              >
                                <Box flexDirection="row" padding="ms">
                                  <Box flex={1}>
                                    <Text variant="body2" color="secondaryText">
                                      Lockup Type
                                    </Text>
                                    <Text variant="body2" color="primaryText">
                                      {isConstant ? 'Constant' : 'Decaying'}
                                    </Text>
                                  </Box>
                                  <Box flex={1}>
                                    <Text
                                      variant="body2"
                                      color="secondaryText"
                                      textAlign="center"
                                    >
                                      Vote Multiplier
                                    </Text>
                                    <Text
                                      variant="body2"
                                      color="primaryText"
                                      textAlign="center"
                                    >
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
                                  <Box flex={1} alignContent="center">
                                    <Text
                                      variant="body2"
                                      color="secondaryText"
                                      textAlign="right"
                                    >
                                      {isConstant
                                        ? 'Min. Duration'
                                        : 'Time left'}
                                    </Text>
                                    <Text
                                      variant="body2"
                                      color="primaryText"
                                      textAlign="right"
                                    >
                                      {isConstant
                                        ? getMinDurationFmt(
                                            pos.lockup.startTs,
                                            pos.lockup.endTs,
                                          )
                                        : getTimeLeftFromNowFmt(
                                            pos.lockup.endTs,
                                          )}
                                    </Text>
                                  </Box>
                                </Box>
                                <Box
                                  borderTopColor="black200"
                                  borderTopWidth={1}
                                  paddingVertical="s"
                                  paddingHorizontal="ms"
                                >
                                  <Text variant="body2" color="secondaryText">
                                    Locked Amount:{' '}
                                    {mintAcc &&
                                      humanReadable(
                                        new BN(pos.amountDepositedNative),
                                        mintAcc.decimals,
                                      )}{' '}
                                    {symbol}
                                  </Text>
                                </Box>
                              </TouchableOpacityBox>
                            )
                          })}
                        </>
                      )}
                    </Box>
                  </SafeAreaBox>
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </HNTKeyboard>
        </BackScreen>
        <Box flexDirection="row" padding="m">
          <ButtonPressable
            flex={1}
            fontSize={16}
            borderRadius="round"
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            backgroundColorDisabled="surfaceSecondary"
            backgroundColorDisabledOpacity={0.9}
            titleColorDisabled="secondaryText"
            title={isSubmitting ? '' : 'Transfer Tokens'}
            titleColor="black"
            onPress={handleSubmit}
            disabled={!amount || !selectedPosPk || isSubmitting}
            TrailingComponent={
              isSubmitting ? <CircleLoader color="white" /> : undefined
            }
          />
        </Box>
      </ReAnimatedBlurBox>
    </Portal>
  )
}
