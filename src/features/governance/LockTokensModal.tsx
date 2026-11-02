import { HNTKeyboard, type HNTKeyboardRef } from '@ui/HNTKeyboard'
import { useMint } from '@helium/helium-react-hooks'
import { HNT_MINT, toBN, toNumber } from '@helium/spl-utils'
import { SubDaoWithMeta, useSubDaos } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { TokenIcon } from '@ui/TokenIcon'
import { getFormattedStringFromDays, yearsToDays } from '@utils/dateTools'
import { getMintMinAmountAsDecimal, precision } from '@utils/formatting'
import { TXN_FEE_IN_LAMPORTS } from '@utils/solanaUtils'
import BN from 'bn.js'
import { Info, X } from 'lucide-react-native'
import React, { useEffect, useEffectEvent, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { withUniwind } from 'uniwind'
import { MOBILE_SUB_DAO_KEY } from '@utils/constants'
import { DataSplitBars } from './components/DataSplitBars'
import { AutomationFeesWidget } from './components/AutomationFeesWidget'
import { GovernanceModal } from './components/GovernanceModal'

const InfoIcon = withUniwind(Info)
const CloseIcon = withUniwind(X)

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
    'Vote power declines linearly until release.',
    'Example: You lock 10.000 tokens for two years. They are then unavailable for the next two years. After this time, you can withdraw them again.',
  ],
  [LockupKind.constant]: [
    'Tokens are locked indefinitely. At any time you can start the unlock process which lasts for the initially chosen lockup duration.',
    'Vote power stays constant until you start the unlock process, then it declines linearly until release.',
    'Example: You lock 10.000 tokens with a lockup duration of one year. After two years you decide to start the unlocking process. Another year after that, you can withdraw the tokens.',
  ],
}

export interface LockTokensModalFormValues {
  lockupKind: { value: LockupKind; display: string }
  amount: number
  lockupPeriod: { value: number; display: string }
  lockupPeriodInDays: number
  subDao?: SubDaoWithMeta
  automationEnabled?: boolean
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
  onPrepare,
  automationEnabled,
  onSetAutomationEnabled,
  estimatedSolFee,
  insufficientBalance = false,
}: {
  insufficientBalance: boolean
  mode?: 'lock' | 'extend' | 'split'
  mint: PublicKey
  minLockupTimeInDays?: number
  maxLockupTimeInDays?: number
  maxLockupAmount: number
  calcMultiplierFn: (lockupPeriodInDays: number) => number
  onClose: () => void
  onSubmit: (values: LockTokensModalFormValues) => Promise<void>
  onPrepare?: (values: LockTokensModalFormValues) => void
  automationEnabled: boolean
  onSetAutomationEnabled: (enabled: boolean) => void
  estimatedSolFee?: string
}) => {
  const { t } = useTranslation()
  const { currentAccount } = useAccountStorage()
  const { info: mintAcc } = useMint(mint)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [showLockupKindInfo, setShowLockupKindInfo] = useState<boolean>(false)
  const [showCustomDuration, setShowCustomDuration] = useState<boolean>(false)
  const [pickedSubDaoPk, setPickedSubDaoPk] = useState<PublicKey | null>(null)
  const [transactionError, setTransactionError] = useState()
  const { loading, result: subDaos } = useSubDaos()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const mintMinAmount = mintAcc ? getMintMinAmountAsDecimal(mintAcc) : 1
  const currentPrecision = precision(mintMinAmount)
  const hasMinLockup = minLockupTimeInDays && minLockupTimeInDays > 0

  const selectedSubDaoPk =
    pickedSubDaoPk ||
    subDaos?.find((subDao) => subDao.pubkey.equals(MOBILE_SUB_DAO_KEY))
      ?.pubkey ||
    null

  const lockupKindOptions = [
    { value: LockupKind.cliff, display: t('gov.positions.decaying') },
    { value: LockupKind.constant, display: t('gov.positions.constant') },
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
  const [lockupPeriodInDays, setLockupPeriodInDays] = useState<number>(
    lockupPeriodOptions[0].value,
  )
  const lockupMultiplier = calcMultiplierFn(lockupPeriodInDays)

  const handleAmountPressed = () => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss()
    } else {
      hntKeyboardRef.current?.show({
        payer: currentAccount,
      })
    }
  }

  const prepare = useEffectEvent(() => {
    onPrepare?.({
      lockupKind,
      lockupPeriod,
      amount: amount ?? 0,
      lockupPeriodInDays,
      automationEnabled,
    })
  })

  const isInitialRender = useRef(true)
  useEffect(() => {
    if (mode === 'lock') return
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }
    if (mode === 'split' && !amount) return

    const timer = setTimeout(prepare, 300)
    return () => clearTimeout(timer)
  }, [mode, lockupPeriodInDays, lockupKind.value, amount])

  const handleAmountChange = ({ balance }: { balance: BN }) => {
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
  }

  const handleOnClose = () => {
    if (showLockupKindInfo) {
      setShowLockupKindInfo(false)
    } else {
      onClose()
    }
  }

  const handleSubmit = async () => {
    if (mode === 'lock' && step === 1 && mint.equals(HNT_MINT)) {
      const formValues: LockTokensModalFormValues = {
        lockupKind,
        lockupPeriod,
        amount: amount!,
        lockupPeriodInDays,
        automationEnabled,
        ...(subDaos && selectedSubDaoPk
          ? {
              subDao: subDaos.find((subDao) =>
                subDao.pubkey.equals(selectedSubDaoPk!),
              )!,
            }
          : {}),
      }
      onPrepare?.(formValues)
      setStep(2)
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({
        lockupKind,
        lockupPeriod,
        amount: amount!,
        lockupPeriodInDays,
        automationEnabled,
        ...(subDaos && selectedSubDaoPk
          ? {
              subDao: subDaos.find((subDao) =>
                subDao.pubkey.equals(selectedSubDaoPk!),
              )!,
            }
          : {}),
      })

      onClose()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setIsSubmitting(false)
      setTransactionError(e.message || t('gov.errors.lockTokens'))

      // error handling handled on position card
      if (['split', 'extend'].includes(mode)) {
        onClose()
      }
    }
  }

  const showError = transactionError

  // A toggle option in the lockup kind and duration rows.
  const optionClassName = (isActive: boolean, extra = '') =>
    `flex-1 items-center rounded-[8px] p-2 ${extra} ${
      isActive ? 'bg-secondary' : 'bg-muted'
    }`
  const optionTextClassName = (isActive: boolean) =>
    isActive ? 'text-foreground' : 'text-muted-foreground'

  return (
    <GovernanceModal onClose={handleOnClose}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {step === 1 && (
          <TouchableWithoutFeedback
            onPress={() => Keyboard.dismiss()}
            accessibilityRole="button"
          >
            <KeyboardAvoidingView
              className="flex-1"
              behavior="padding"
              enabled
              keyboardVerticalOffset={100}
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
                <ScrollView contentInsetAdjustmentBehavior="automatic">
                  {!showLockupKindInfo && (
                    <View className="grow justify-center">
                      <Text
                        size="xl"
                        className="font-semibold"
                        adjustsFontSizeToFit
                      >
                        {
                          {
                            lock: t('gov.transactions.lockTokens'),
                            extend: t('gov.transactions.extendPosition'),
                            split: t('gov.transactions.splitPosition'),
                          }[mode]
                        }
                      </Text>
                      <Text className="mb-2 text-muted-foreground">
                        {t('gov.votingPower.increase')}
                      </Text>
                      {hasMinLockup ? (
                        <View className="mb-2 rounded-[12px] bg-card p-3">
                          <Text size="xs">
                            {t('gov.positions.longerLockup', {
                              existing:
                                getFormattedStringFromDays(minLockupTimeInDays),
                            })}
                          </Text>
                          {mode === 'split' ? (
                            <Text size="xs" className="mt-3">
                              {t('gov.positions.splitWarning')}
                            </Text>
                          ) : null}
                        </View>
                      ) : null}
                      <View className="rounded-[12px] bg-card">
                        {['lock', 'split'].includes(mode) && (
                          <>
                            <View className="p-4">
                              <View className="mb-2 flex-row content-center justify-between">
                                <Text className="mb-2 text-muted-foreground">
                                  {t('gov.positions.lockupType')}
                                </Text>
                                <PressableScale
                                  feedback="opacity"
                                  accessibilityRole="button"
                                  accessibilityLabel={t(
                                    'gov.positions.lockupType',
                                  )}
                                  onPress={() => setShowLockupKindInfo(true)}
                                >
                                  <InfoIcon
                                    size={20}
                                    colorClassName="accent-muted-foreground"
                                  />
                                </PressableScale>
                              </View>
                              <View className="flex-row">
                                {lockupKindOptions.map((option, idx) => {
                                  const isActive =
                                    option.value === lockupKind.value

                                  return (
                                    <PressableScale
                                      key={option.value}
                                      feedback="opacity"
                                      className={optionClassName(
                                        isActive,
                                        idx > 0 ? 'ml-3' : '',
                                      )}
                                      onPress={() => {
                                        setLockupKind(option)
                                      }}
                                    >
                                      <Text
                                        size="base"
                                        className={optionTextClassName(
                                          isActive,
                                        )}
                                      >
                                        {option.display}
                                      </Text>
                                    </PressableScale>
                                  )
                                })}
                              </View>
                            </View>
                            <PressableScale
                              feedback="opacity"
                              className="border-y border-border p-4"
                              onPress={handleAmountPressed}
                            >
                              <Text className="text-muted-foreground">
                                {t('gov.positions.amountToLock')}
                              </Text>
                              <Text
                                size="base"
                                className={
                                  amount
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                                }
                              >
                                {amount || 'Amount (tokens)'}
                              </Text>
                            </PressableScale>
                          </>
                        )}
                        {!showCustomDuration && (
                          <View className="p-4">
                            <View className="mb-2 flex-row content-center justify-between">
                              <Text className="mb-2 text-muted-foreground">
                                {t('gov.positions.duration')}
                              </Text>
                              <PressableScale
                                feedback="opacity"
                                onPress={() =>
                                  setShowCustomDuration((oldValue) => !oldValue)
                                }
                              >
                                <Text className="mb-2">
                                  {t('gov.positions.customDuration')}
                                </Text>
                              </PressableScale>
                            </View>
                            {hasMinLockup ? (
                              <View className="mb-3 flex-row">
                                <PressableScale
                                  feedback="opacity"
                                  className={optionClassName(
                                    !showCustomDuration &&
                                      lockupPeriodOptions[0].value ===
                                        lockupPeriod.value,
                                  )}
                                  onPress={() => {
                                    setLockupPeriod(lockupPeriodOptions[0])
                                    setLockupPeriodInDays(
                                      lockupPeriodOptions[0].value,
                                    )
                                    setShowCustomDuration(false)
                                  }}
                                >
                                  <Text
                                    size="base"
                                    className={optionTextClassName(
                                      lockupPeriodOptions[0].value ===
                                        lockupPeriod.value,
                                    )}
                                  >
                                    {getFormattedStringFromDays(
                                      minLockupTimeInDays,
                                    )}
                                  </Text>
                                </PressableScale>
                              </View>
                            ) : null}
                            <View className="flex-row flex-wrap">
                              {(hasMinLockup
                                ? [...lockupPeriodOptions.splice(1)]
                                : lockupPeriodOptions
                              ).map((option, idx) => {
                                const isActive =
                                  !showCustomDuration &&
                                  option.value === lockupPeriod.value

                                return (
                                  <PressableScale
                                    key={option.value}
                                    feedback="opacity"
                                    className={optionClassName(
                                      isActive,
                                      idx > 0 ? 'ml-2' : '',
                                    )}
                                    onPress={() => {
                                      setLockupPeriod(option)
                                      setLockupPeriodInDays(option.value)
                                      setShowCustomDuration(false)
                                    }}
                                  >
                                    <Text
                                      size="base"
                                      className={optionTextClassName(isActive)}
                                    >
                                      {option.display}
                                    </Text>
                                  </PressableScale>
                                )
                              })}
                            </View>
                          </View>
                        )}
                        {showCustomDuration && (
                          <View className="p-4">
                            <Text className="mb-2 font-medium text-muted-foreground">
                              {t('gov.positions.customDurationPlaceholder')}
                            </Text>
                            <View className="flex-row items-center gap-2">
                              <Input
                                className="flex-1"
                                placeholder={t(
                                  'gov.positions.customDurationPlaceholder',
                                )}
                                value={lockupPeriodInDays.toString()}
                                keyboardType="numeric"
                                onChangeText={(text) =>
                                  setLockupPeriodInDays(Number(text || 0))
                                }
                                onBlur={() => {
                                  const val = lockupPeriodInDays

                                  setLockupPeriodInDays(
                                    val > minLockupTimeInDays
                                      ? val > maxLockupTimeInDays
                                        ? maxLockupTimeInDays
                                        : val
                                      : minLockupTimeInDays,
                                  )
                                }}
                              />
                              <PressableScale
                                feedback="opacity"
                                hitSlop={12}
                                accessibilityRole="button"
                                accessibilityLabel="Close"
                                onPress={() => {
                                  setShowCustomDuration(false)
                                  setLockupPeriodInDays(lockupPeriod.value)
                                }}
                              >
                                <CloseIcon
                                  size={20}
                                  colorClassName="accent-foreground"
                                />
                              </PressableScale>
                            </View>
                          </View>
                        )}
                        <View className="border-t border-border p-4">
                          <View className="flex-row justify-between">
                            <Text className="text-muted-foreground">
                              {t('gov.positions.initialVotePowerMult')}:
                            </Text>
                            <Text>{lockupMultiplier}x</Text>
                          </View>
                          <View className="mt-2 flex-row overflow-hidden rounded-[8px] bg-muted">
                            <View
                              className="h-1.5 flex-row bg-mobile"
                              style={{ width: `${lockupMultiplier}%` }}
                            />
                          </View>
                        </View>
                        {mode !== 'lock' && (
                          <View className="border-t border-border p-4">
                            <View className="flex-row justify-between">
                              <Text className="text-muted-foreground">
                                {t('gov.automation.estimatedFee')}
                              </Text>
                              <Text>
                                {estimatedSolFee
                                  ? `${estimatedSolFee} SOL`
                                  : '-- SOL'}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                    </View>
                  )}
                  {showLockupKindInfo && (
                    <View className="grow justify-center">
                      {lockupKindOptions.map((type) => (
                        <View key={type.value} className="justify-center">
                          <Text
                            size="xl"
                            className="font-semibold"
                            adjustsFontSizeToFit
                          >
                            {type.display}
                          </Text>
                          {lockupInfosByType[type.value].map((info, idx) => (
                            <Text
                              key={`info-${idx}`}
                              className="mb-4 text-muted-foreground"
                            >
                              {info}
                            </Text>
                          ))}
                        </View>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </HNTKeyboard>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        )}
        {step === 2 && (
          <View className="grow justify-center">
            {!loading && (
              <>
                <Text size="xl" className="font-semibold" adjustsFontSizeToFit>
                  {t('gov.transactions.delegatePosition')}
                </Text>
                <Text className="mb-2 text-muted-foreground">
                  {t('gov.positions.selectSubDao')}
                </Text>
                <View className="rounded-[12px] bg-card p-3">
                  <Text size="xs">{t('gov.positions.delegateBlurb')}</Text>
                </View>

                <DataSplitBars />

                {subDaos && (
                  <View className="mt-4 gap-4 rounded-[8px] bg-card p-4">
                    {subDaos
                      ?.sort((a, b) =>
                        b.dntMetadata.name.localeCompare(a.dntMetadata.name),
                      )
                      .map((subDao) => {
                        const isSelected = selectedSubDaoPk?.equals(
                          subDao.pubkey,
                        )
                        return (
                          <PressableScale
                            key={subDao.pubkey.toString()}
                            feedback="opacity"
                            className={`rounded-[12px] ${
                              isSelected ? 'bg-secondary' : 'bg-muted'
                            }`}
                            onPress={() => setPickedSubDaoPk(subDao.pubkey)}
                          >
                            <View className="flex-row items-center p-3">
                              <View className="rounded-full border-2 border-black">
                                <TokenIcon
                                  size={26}
                                  img={subDao.dntMetadata.json?.image || ''}
                                />
                              </View>
                              <Text size="base" className="ml-4 font-medium">
                                {subDao.dntMetadata.name.replace('Helium', '')}
                              </Text>
                            </View>
                          </PressableScale>
                        )
                      })}
                  </View>
                )}

                <AutomationFeesWidget
                  automationEnabled={automationEnabled}
                  onSetAutomationEnabled={onSetAutomationEnabled}
                  estimatedSolFee={estimatedSolFee}
                />
              </>
            )}
            {loading && (
              <View className="items-center justify-center">
                <Spinner />
                <Text className="mt-3 text-muted-foreground">
                  {t('gov.positions.fetchingSubDaos')}
                </Text>
              </View>
            )}
            {showError && (
              <View className="flex-row items-center justify-center pt-3">
                <Text size="xs" className="font-medium text-destructive">
                  {showError}
                </Text>
              </View>
            )}
          </View>
        )}
        {step === 1 && (
          <View className="flex-row pt-3">
            {!showLockupKindInfo ? (
              <Button
                variant="cta"
                size="dashboard"
                className="flex-1"
                onPress={() => void handleSubmit().catch(console.error)}
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
              >
                {isSubmitting ? (
                  <Spinner colorClassName="accent-white" />
                ) : (
                  {
                    lock: mint.equals(HNT_MINT)
                      ? t('generic.next')
                      : t('gov.transactions.lockTokens'),
                    extend: t('gov.transactions.extendPosition'),
                    split: t('gov.transactions.splitPosition'),
                  }[mode]
                )}
              </Button>
            ) : (
              <Button
                variant="cta"
                size="dashboard"
                className="flex-1"
                onPress={() => {
                  setShowLockupKindInfo(false)
                }}
              >
                Back
              </Button>
            )}
          </View>
        )}
        {step === 2 && (
          <View className="flex-row pt-3">
            <Button
              variant="cta"
              size="dashboard"
              className="flex-1"
              onPress={() => void handleSubmit().catch(console.error)}
              disabled={isSubmitting || insufficientBalance}
            >
              {isSubmitting ? (
                <Spinner colorClassName="accent-white" />
              ) : insufficientBalance ? (
                t('generic.insufficientSol')
              ) : (
                t('gov.transactions.lockTokens')
              )}
            </Button>
          </View>
        )}
      </ScrollView>
    </GovernanceModal>
  )
}

export default LockTokensModal
