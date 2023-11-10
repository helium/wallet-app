/* eslint-disable @typescript-eslint/no-unused-vars */
import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { FadeInFast } from '@components/FadeInOut'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useMint } from '@helium/helium-react-hooks'
import { TXN_FEE_IN_LAMPORTS } from '@utils/solanaUtils'
import { PublicKey } from '@solana/web3.js'
import { yearsToDays } from '@utils/dateTools'
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
  none = 'none',
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
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [showLockupKindInfo, setShowLockupKindInfo] = useState<boolean>(false)
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const mintMinAmount = mintAcc ? getMintMinAmountAsDecimal(mintAcc) : 1
  const currentPrecision = precision(mintMinAmount)
  const hasMinLockup = minLockupTimeInDays && minLockupTimeInDays > 0
  const hasMaxLockup = maxLockupTimeInDays && maxLockupTimeInDays !== Infinity

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
  const [lockupPeriod, setLockupPeriod] = useState(lockupPeriodOptions[0])
  const [amount, setAmount] = useState<number | undefined>()

  const handleAmountPressed = useCallback(() => {
    Keyboard.dismiss()
    hntKeyboardRef.current?.show({
      payer: currentAccount,
    })
  }, [currentAccount])

  const handleSubmit = async () => {
    /*     if (amount) {
      await onSubmit({ lockupKind, lockupPeriod, amount })
    } */
  }

  return (
    <ReAnimatedBlurBox
      visible
      entering={FadeInFast}
      position="absolute"
      zIndex={9999}
      height="100%"
      width="100%"
    >
      <BackScreen
        headerTopMargin="l"
        padding="none"
        hideBack
        edges={backEdges}
        onClose={onClose}
      >
        <HNTKeyboard
          ref={hntKeyboardRef}
          onConfirmBalance={({ balance }: { balance: BN }) =>
            setAmount(balance.toNumber())
          }
          mint={mint}
          networkFee={SOL_TXN_FEE}
          usePortal
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
                <Box flexGrow={1} justifyContent="center">
                  <Text
                    textAlign="left"
                    variant="subtitle2"
                    adjustsFontSizeToFit
                  >
                    Lock Tokens
                  </Text>
                  <Text
                    variant="subtitle4"
                    color="secondaryText"
                    marginBottom="m"
                  >
                    Lock tokens to increase your voting power.
                  </Text>
                  <Box backgroundColor="secondary" borderRadius="l">
                    <Box padding="m">
                      <Text
                        variant="subtitle4"
                        color="grey600"
                        marginBottom="s"
                      >
                        Lockup Type
                      </Text>
                      <Box flexDirection="row">
                        {lockupKindOptions.map((option) => {
                          const isActive = option.value === lockupKind.value

                          return (
                            <TouchableOpacityBox
                              key={option.value}
                              flex={1}
                              padding="ms"
                              alignItems="center"
                              borderRadius="m"
                              backgroundColor={
                                isActive ? 'surfaceSecondary' : 'black500'
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

                      <Text fontSize={19} fontWeight="400" color="grey600">
                        {amount || 'Amount (tokens)'}
                      </Text>
                    </TouchableOpacityBox>
                    <Box padding="m">
                      <Text
                        variant="subtitle4"
                        color="grey600"
                        marginBottom="s"
                      >
                        Duration
                      </Text>
                      <Box flexDirection="row">
                        {defaultLockupPeriods.map((option) => {
                          const isActive = option.value === lockupPeriod.value

                          return (
                            <TouchableOpacityBox
                              key={option.value}
                              flex={1}
                              padding="ms"
                              alignItems="center"
                              borderRadius="m"
                              backgroundColor={
                                isActive ? 'surfaceSecondary' : 'black500'
                              }
                              onPress={() => setLockupPeriod(option)}
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
                </Box>
              </SafeAreaBox>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </HNTKeyboard>
      </BackScreen>
      <Box flexDirection="row" padding="m">
        <ButtonPressable
          height={50}
          flex={1}
          fontSize={16}
          borderRadius="round"
          borderWidth={2}
          borderColor="white"
          backgroundColor="white"
          backgroundColorOpacityPressed={0.7}
          title="Lock Tokens"
          titleColor="black"
          onPress={handleSubmit}
        />
      </Box>
    </ReAnimatedBlurBox>
  )
}

export default LockTokensModal
