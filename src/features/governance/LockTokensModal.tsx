/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { FadeInFast } from '@components/FadeInOut'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import SafeAreaBox from '@components/SafeAreaBox'
import InfoIcon from '@assets/images/info.svg'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint } from '@helium/helium-react-hooks'
import { TXN_FEE_IN_LAMPORTS } from '@utils/solanaUtils'
import { PublicKey } from '@solana/web3.js'
import { getFormattedStringFromDays, yearsToDays } from '@utils/dateTools'
import { getMintMinAmountAsDecimal, precision } from '@utils/formatting'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import BN from 'bn.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { toBN, toNumber } from '@helium/spl-utils'
import { Portal } from '@gorhom/portal'

const SOL_TXN_FEE = new BN(TXN_FEE_IN_LAMPORTS)
export const defaultLockupPeriods = [
  {
    value: 183,
    display: '6m',
  },
  {
    value: yearsToDays(1),
    display: '1y',
  },
  {
    value: yearsToDays(2),
    display: '2y',
  },
  {
    value: yearsToDays(3),
    display: '3y',
  },
  {
    value: yearsToDays(4),
    display: '4y',
  },
]

export enum LockupKind {
  cliff = 'cliff',
  constant = 'constant',
}

const lockupInfosByType = {
  [LockupKind.cliff]: [
    'Tokens are locked for a fixed duration and are released in full at the end of it.',
    'Vote weight declines linearly until release.',
    'Example: You lock 10.000 tokens for two years. They are then unavailable for the next two years. After this time, you can withdraw them again.',
  ],
  [LockupKind.constant]: [
    'Tokens are locked indefinitely. At any time you can start the unlock process which lasts for the initially chosen lockup duration.',
    'Vote weight stays constant until you start the unlock process, then it declines linearly until release.',
    'Example: You lock 10.000 tokens with a lockup duration of one year. After two years you decide to start the unlocking process. Another year after that, you can withdraw the tokens.',
  ],
}

export interface LockTokensModalFormValues {
  lockupKind: { value: LockupKind; display: string }
  amount: number
  lockupPeriod: { value: number; display: string }
  lockupPeriodInDays: number
}

export const LockTokensModal = ({
  mint,
  mode = 'lock',
  minLockupTimeInDays = 0,
  maxLockupTimeInDays = Infinity,
  maxLockupAmount,
  calcMultiplierFn,
  onClose,
  onSubmit,
}: {
  mode?: 'lock' | 'extend' | 'split'
  mint: PublicKey
  minLockupTimeInDays?: number
  maxLockupTimeInDays?: number
  maxLockupAmount: number
  calcMultiplierFn: (lockupPeriodInDays: number) => number
  onClose: () => void
  onSubmit: (values: LockTokensModalFormValues) => Promise<void>
}) => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const safeEdges = useMemo(() => ['bottom'] as Edge[], [])
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const { info: mintAcc } = useMint(mint)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showLockupKindInfo, setShowLockupKindInfo] = useState<boolean>(false)
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const mintMinAmount = mintAcc ? getMintMinAmountAsDecimal(mintAcc) : 1
  const currentPrecision = precision(mintMinAmount)
  const hasMinLockup = minLockupTimeInDays && minLockupTimeInDays > 0

  const lockupKindOptions = [
    { value: LockupKind.cliff, display: 'Decaying' },
    { value: LockupKind.constant, display: 'Constant' },
  ]

  const lockupPeriodOptions = [
    ...(hasMinLockup
      ? [
          {
            value: minLockupTimeInDays,
            display: 'min',
          },
        ]
      : []),
    ...defaultLockupPeriods.filter(
      (lp) => lp.value > minLockupTimeInDays && lp.value <= maxLockupTimeInDays,
    ),
  ]

  const [lockupKind, setLockupKind] = useState(lockupKindOptions[0])
  const [amount, setAmount] = useState<number | undefined>()
  const [lockupPeriod, setLockupPeriod] = useState(lockupPeriodOptions[0])

  const handleAmountPressed = useCallback(() => {
    Keyboard.dismiss()
    hntKeyboardRef.current?.show({
      payer: currentAccount,
    })
  }, [currentAccount])

  const handleAmountChange = useCallback(
    ({ balance }: { balance: BN }) => {
      if (balance.eq(new BN(0)) || !mintAcc) {
        setAmount(undefined)
      } else {
        setAmount(
          parseFloat(
            Math.max(
              mintMinAmount,
              Math.min(maxLockupAmount, toNumber(balance, mintAcc?.decimals)),
            ).toFixed(currentPrecision),
          ),
        )
      }
    },
    [mintAcc, maxLockupAmount, mintMinAmount, currentPrecision],
  )

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true)
      await onSubmit({
        lockupKind,
        lockupPeriod,
        amount: amount!,
        lockupPeriodInDays: lockupPeriod.value,
      })
      onClose()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setIsSubmitting(false)
      console.error('Unable to lock tokens', e.message)
    }
  }, [lockupKind, lockupPeriod, amount, onClose, onSubmit])

  const handleOnClose = useCallback(() => {
    if (showLockupKindInfo) {
      setShowLockupKindInfo(false)
    } else {
      onClose()
    }
  }, [showLockupKindInfo, onClose])

  const lockupMultiplier = useMemo(
    () => calcMultiplierFn(lockupPeriod.value),
    [lockupPeriod, calcMultiplierFn],
  )

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
              maxLockupAmount && mintAcc
                ? toBN(maxLockupAmount, mintAcc.decimals)
                : undefined
            }
            onConfirmBalance={handleAmountChange}
          >
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <SafeAreaBox
                  edges={safeEdges}
                  backgroundColor="transparent"
                  flex={1}
                  padding="m"
                  marginHorizontal="s"
                  marginVertical="xs"
                >
                  {!showLockupKindInfo && (
                    <Box flexGrow={1} justifyContent="center">
                      <Text
                        textAlign="left"
                        variant="subtitle2"
                        adjustsFontSizeToFit
                      >
                        {
                          {
                            lock: 'Lock Tokens',
                            extend: 'Extend Lockup',
                            split: 'Split Position',
                          }[mode]
                        }
                      </Text>
                      <Text
                        variant="subtitle4"
                        color="secondaryText"
                        marginBottom="m"
                      >
                        Increase your voting power by locking tokens.
                      </Text>
                      {hasMinLockup ? (
                        <Box
                          borderRadius="l"
                          backgroundColor="secondary"
                          padding="ms"
                          marginBottom="m"
                        >
                          <Text variant="body3">
                            Select a new lockup period longer than or equal to
                            the existing{' '}
                            {getFormattedStringFromDays(minLockupTimeInDays)}
                          </Text>
                          {mode === 'split' ? (
                            <Text marginTop="m" variant="body3">
                              Splitting a Landrush position after the Landrush
                              period will result in the split tokens losing the
                              multiplier!
                            </Text>
                          ) : null}
                        </Box>
                      ) : null}
                      <Box backgroundColor="secondary" borderRadius="l">
                        {['lock', 'split'].includes(mode) && (
                          <>
                            <Box padding="ms">
                              <Box
                                flexDirection="row"
                                justifyContent="space-between"
                                alignContent="center"
                                marginBottom="s"
                              >
                                <Text
                                  variant="subtitle4"
                                  color="grey600"
                                  marginBottom="s"
                                >
                                  Lockup Type
                                </Text>
                                <TouchableOpacityBox
                                  onPress={() => setShowLockupKindInfo(true)}
                                >
                                  <InfoIcon width={20} />
                                </TouchableOpacityBox>
                              </Box>
                              <Box flexDirection="row">
                                {lockupKindOptions.map((option, idx) => {
                                  const isActive =
                                    option.value === lockupKind.value

                                  return (
                                    <TouchableOpacityBox
                                      key={option.value}
                                      flex={1}
                                      padding="s"
                                      marginLeft={idx === 0 ? 'none' : 'ms'}
                                      alignItems="center"
                                      borderRadius="m"
                                      backgroundColor={
                                        isActive
                                          ? 'surfaceSecondary'
                                          : 'black500'
                                      }
                                      onPress={() => setLockupKind(option)}
                                    >
                                      <Text
                                        fontSize={19}
                                        fontWeight="400"
                                        color={
                                          isActive
                                            ? 'primaryText'
                                            : 'surfaceSecondaryText'
                                        }
                                      >
                                        {option.display}
                                      </Text>
                                    </TouchableOpacityBox>
                                  )
                                })}
                              </Box>
                            </Box>
                            <TouchableOpacityBox
                              borderTopColor="black200"
                              borderTopWidth={1}
                              borderBottomColor="black200"
                              borderBottomWidth={1}
                              paddingHorizontal="m"
                              paddingVertical="l"
                              onPress={handleAmountPressed}
                            >
                              <Text variant="subtitle4" color="grey600">
                                Amount to lock
                              </Text>

                              <Text
                                fontSize={19}
                                fontWeight="400"
                                color="grey600"
                              >
                                {amount || 'Amount (tokens)'}
                              </Text>
                            </TouchableOpacityBox>
                          </>
                        )}
                        <Box padding="ms">
                          <Text
                            variant="subtitle4"
                            color="grey600"
                            marginBottom="s"
                          >
                            Duration
                          </Text>
                          {hasMinLockup ? (
                            <Box flexDirection="row" marginBottom="m">
                              <TouchableOpacityBox
                                flex={1}
                                padding="s"
                                alignItems="center"
                                borderRadius="m"
                                backgroundColor={
                                  lockupPeriodOptions[0].value ===
                                  lockupPeriod.value
                                    ? 'surfaceSecondary'
                                    : 'black500'
                                }
                                onPress={() => {
                                  setLockupPeriod(lockupPeriodOptions[0])
                                }}
                              >
                                <Text
                                  fontSize={19}
                                  fontWeight="400"
                                  color={
                                    lockupPeriodOptions[0].value ===
                                    lockupPeriod.value
                                      ? 'primaryText'
                                      : 'surfaceSecondaryText'
                                  }
                                >
                                  {getFormattedStringFromDays(
                                    minLockupTimeInDays,
                                  )}
                                </Text>
                              </TouchableOpacityBox>
                            </Box>
                          ) : null}
                          <Box flexDirection="row" flexWrap="wrap">
                            {(hasMinLockup
                              ? [...lockupPeriodOptions.splice(1)]
                              : lockupPeriodOptions
                            ).map((option, idx) => {
                              const isActive =
                                option.value === lockupPeriod.value

                              return (
                                <TouchableOpacityBox
                                  key={option.value}
                                  flex={1}
                                  padding="s"
                                  marginLeft={idx === 0 ? 'none' : 'ms'}
                                  alignItems="center"
                                  borderRadius="m"
                                  backgroundColor={
                                    isActive ? 'surfaceSecondary' : 'black500'
                                  }
                                  onPress={() => {
                                    setLockupPeriod(option)
                                  }}
                                >
                                  <Text
                                    fontSize={19}
                                    fontWeight="400"
                                    color={
                                      isActive
                                        ? 'primaryText'
                                        : 'surfaceSecondaryText'
                                    }
                                  >
                                    {option.display}
                                  </Text>
                                </TouchableOpacityBox>
                              )
                            })}
                          </Box>
                        </Box>
                      </Box>
                      <Box flexDirection="row" marginTop="m">
                        <Text variant="subtitle4" color="secondaryText">
                          Initial Vote Weight Multiplier:
                        </Text>
                        <Text
                          variant="subtitle4"
                          color="secondaryText"
                          marginLeft="m"
                        >
                          {lockupMultiplier}x
                        </Text>
                      </Box>
                    </Box>
                  )}
                  {showLockupKindInfo && (
                    <Box flexGrow={1} justifyContent="center">
                      {lockupKindOptions.map((type) => (
                        <Box
                          key={type.value}
                          flexGrow={1}
                          justifyContent="center"
                        >
                          <Text
                            textAlign="left"
                            variant="subtitle2"
                            adjustsFontSizeToFit
                          >
                            {type.display}
                          </Text>
                          {lockupInfosByType[type.value].map((info) => (
                            <Text
                              variant="subtitle4"
                              color="secondaryText"
                              marginBottom="m"
                            >
                              {info}
                            </Text>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  )}
                </SafeAreaBox>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </HNTKeyboard>
        </BackScreen>
        <Box flexDirection="row" padding="m">
          {!showLockupKindInfo ? (
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
                isSubmitting
                  ? ''
                  : {
                      lock: 'Lock Tokens',
                      extend: 'Extend Lockup',
                      split: 'Split Position',
                    }[mode]
              }
              titleColor="black"
              onPress={handleSubmit}
              disabled={
                {
                  lock:
                    !amount ||
                    !maxLockupAmount ||
                    !lockupPeriod.value ||
                    lockupPeriod.value === 0 ||
                    isSubmitting,
                  extend:
                    !lockupPeriod.value ||
                    lockupPeriod.value === 0 ||
                    isSubmitting,
                  split:
                    !amount ||
                    !maxLockupAmount ||
                    !lockupPeriod.value ||
                    lockupPeriod.value === 0 ||
                    isSubmitting,
                }[mode]
              }
              TrailingComponent={
                isSubmitting ? <CircleLoader color="black" /> : undefined
              }
            />
          ) : (
            <ButtonPressable
              flex={1}
              fontSize={16}
              borderRadius="round"
              backgroundColor="white"
              backgroundColorOpacityPressed={0.7}
              title="Back"
              titleColor="black"
              onPress={() => setShowLockupKindInfo(false)}
            />
          )}
        </Box>
      </ReAnimatedBlurBox>
    </Portal>
  )
}

export default LockTokensModal
