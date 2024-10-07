/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Close from '@assets/images/close.svg'
import InfoIcon from '@assets/images/info.svg'
import { ReAnimatedBlurBox } from '@components/AnimatedBox'
import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import { FadeInFast } from '@components/FadeInOut'
import HNTKeyboard, { HNTKeyboardRef } from '@components/HNTKeyboard'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TokenIcon from '@components/TokenIcon'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { Portal } from '@gorhom/portal'
import { useMint } from '@helium/helium-react-hooks'
import { HNT_MINT, toBN, toNumber } from '@helium/spl-utils'
import { SubDaoWithMeta, useSubDaos } from '@helium/voter-stake-registry-hooks'
import { PublicKey } from '@solana/web3.js'
import { useAccountStorage } from '@storage/AccountStorageProvider'
import { getFormattedStringFromDays, yearsToDays } from '@utils/dateTools'
import { getMintMinAmountAsDecimal, precision } from '@utils/formatting'
import { TXN_FEE_IN_LAMPORTS } from '@utils/solanaUtils'
import BN from 'bn.js'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import HntIcon from '@assets/images/helium.svg'
import { ScrollView } from 'react-native-gesture-handler'

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
  const backEdges = useMemo(() => ['top'] as Edge[], [])
  const { info: mintAcc } = useMint(mint)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [showLockupKindInfo, setShowLockupKindInfo] = useState<boolean>(false)
  const [showCustomDuration, setShowCustomDuration] = useState<boolean>(false)
  const [selectedSubDaoPk, setSelectedSubDaoPk] = useState<PublicKey | null>(
    null,
  )
  const [transactionError, setTransactionError] = useState()
  const { loading, result: subDaos } = useSubDaos()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)
  const mintMinAmount = mintAcc ? getMintMinAmountAsDecimal(mintAcc) : 1
  const currentPrecision = precision(mintMinAmount)
  const hasMinLockup = minLockupTimeInDays && minLockupTimeInDays > 0

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
  const lockupMultiplier = useMemo(
    () => calcMultiplierFn(lockupPeriodInDays),
    [lockupPeriodInDays, calcMultiplierFn],
  )

  const handleAmountPressed = () => {
    if (Keyboard.isVisible()) {
      Keyboard.dismiss()
    } else {
      hntKeyboardRef.current?.show({
        payer: currentAccount,
      })
    }
  }

  useEffect(() => {
    if (lockupPeriod) {
      setLockupPeriodInDays(lockupPeriod.value)
    }
  }, [lockupPeriod, setLockupPeriodInDays])

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
    }

    // error handling handled on position card
    if (['split', 'extend'].includes(mode)) {
      onClose()
    }
  }

  const showError = useMemo(() => {
    if (transactionError) return transactionError
  }, [transactionError])

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
          {step === 1 && (
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior="padding"
                enabled
                keyboardVerticalOffset={100}
              >
                <ScrollView>
                  {!showLockupKindInfo && (
                    <Box flexGrow={1} justifyContent="center">
                      <Text
                        textAlign="left"
                        variant="textLgMedium"
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
                      <Text
                        variant="textSmMedium"
                        color="secondaryText"
                        marginBottom="2"
                      >
                        {t('gov.votingPower.increase')}
                      </Text>
                      {hasMinLockup ? (
                        <Box
                          borderRadius="2xl"
                          backgroundColor="secondaryBackground"
                          padding="3"
                          marginBottom="2"
                        >
                          <Text variant="textXsRegular">
                            {t('gov.positions.longerLockup', {
                              existing:
                                getFormattedStringFromDays(minLockupTimeInDays),
                            })}
                          </Text>
                          {mode === 'split' ? (
                            <Text marginTop="3" variant="textXsRegular">
                              {t('gov.positions.splitWarning')}
                            </Text>
                          ) : null}
                        </Box>
                      ) : null}
                      <Box
                        backgroundColor="secondaryBackground"
                        borderRadius="2xl"
                      >
                        {['lock', 'split'].includes(mode) && (
                          <>
                            <Box padding="4">
                              <Box
                                flexDirection="row"
                                justifyContent="space-between"
                                alignContent="center"
                                marginBottom="2"
                              >
                                <Text
                                  variant="textSmMedium"
                                  color="gray.600"
                                  marginBottom="2"
                                >
                                  {t('gov.positions.lockupType')}
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
                                      padding="2"
                                      alignItems="center"
                                      borderRadius="2xl"
                                      marginLeft={idx > 0 ? '3' : 'none'}
                                      backgroundColor={
                                        isActive ? 'bg.tertiary' : 'gray.800'
                                      }
                                      onPress={() => {
                                        setLockupKind(option)
                                      }}
                                    >
                                      <Text
                                        variant="textMdRegular"
                                        fontWeight="400"
                                        color={
                                          isActive
                                            ? 'primaryText'
                                            : 'secondaryText'
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
                              borderTopColor="gray.true-700"
                              borderTopWidth={1}
                              borderBottomColor="gray.true-700"
                              borderBottomWidth={1}
                              padding="4"
                              onPress={handleAmountPressed}
                            >
                              <Text variant="textSmMedium" color="gray.600">
                                {t('gov.positions.amountToLock')}
                              </Text>
                              <Text
                                variant="textMdRegular"
                                fontWeight="400"
                                color={amount ? 'base.white' : 'gray.600'}
                              >
                                {amount || 'Amount (tokens)'}
                              </Text>
                            </TouchableOpacityBox>
                          </>
                        )}
                        {!showCustomDuration && (
                          <Box padding="4">
                            <Box
                              flexDirection="row"
                              justifyContent="space-between"
                              alignContent="center"
                              marginBottom="2"
                            >
                              <Text
                                variant="textSmMedium"
                                color="gray.600"
                                marginBottom="2"
                              >
                                {t('gov.positions.duration')}
                              </Text>
                              <TouchableOpacityBox
                                onPress={() =>
                                  setShowCustomDuration((oldValue) => !oldValue)
                                }
                              >
                                <Text
                                  variant="textSmMedium"
                                  color="primaryText"
                                  marginBottom="2"
                                  alignContent="center"
                                >
                                  {t('gov.positions.customDuration')}
                                </Text>
                              </TouchableOpacityBox>
                            </Box>
                            {hasMinLockup ? (
                              <Box flexDirection="row" marginBottom="3">
                                <TouchableOpacityBox
                                  flex={1}
                                  padding="2"
                                  alignItems="center"
                                  borderRadius="2xl"
                                  backgroundColor={
                                    !showCustomDuration &&
                                    lockupPeriodOptions[0].value ===
                                      lockupPeriod.value
                                      ? 'bg.tertiary'
                                      : 'gray.800'
                                  }
                                  onPress={() => {
                                    setLockupPeriod(lockupPeriodOptions[0])
                                    setShowCustomDuration(false)
                                  }}
                                >
                                  <Text
                                    variant="textMdRegular"
                                    fontWeight="400"
                                    color={
                                      lockupPeriodOptions[0].value ===
                                      lockupPeriod.value
                                        ? 'primaryText'
                                        : 'secondaryText'
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
                                  !showCustomDuration &&
                                  option.value === lockupPeriod.value

                                return (
                                  <TouchableOpacityBox
                                    key={option.value}
                                    flex={1}
                                    padding="2"
                                    alignItems="center"
                                    borderRadius="2xl"
                                    marginLeft={idx > 0 ? '2' : 'none'}
                                    backgroundColor={
                                      isActive ? 'bg.tertiary' : 'gray.800'
                                    }
                                    onPress={() => {
                                      setLockupPeriod(option)
                                      setShowCustomDuration(false)
                                    }}
                                  >
                                    <Text
                                      variant="textMdRegular"
                                      fontWeight="400"
                                      color={
                                        isActive
                                          ? 'primaryText'
                                          : 'secondaryText'
                                      }
                                    >
                                      {option.display}
                                    </Text>
                                  </TouchableOpacityBox>
                                )
                              })}
                            </Box>
                          </Box>
                        )}
                        {showCustomDuration && (
                          <TextInput
                            variant="transparent"
                            floatingLabel={t(
                              'gov.positions.customDurationPlaceholder',
                            )}
                            floatingLabelWeight="500"
                            fontSize={16}
                            fontWeight="400"
                            TrailingIcon={() => <Close color="primaryText" />}
                            TrailingIconOptions={{
                              onPress: () => {
                                setShowCustomDuration(false)
                                setLockupPeriodInDays(lockupPeriod.value)
                              },
                            }}
                            textInputProps={{
                              placeholder: t(
                                'gov.positions.customDurationPlaceholder',
                              ),
                              value: lockupPeriodInDays.toString(),
                              keyboardType: 'numeric',
                              onChangeText: (text) =>
                                setLockupPeriodInDays(Number(text || 0)),
                              onBlur: () => {
                                const val = lockupPeriodInDays

                                setLockupPeriodInDays(
                                  // eslint-disable-next-line no-nested-ternary
                                  val > minLockupTimeInDays
                                    ? val > maxLockupTimeInDays
                                      ? maxLockupTimeInDays
                                      : val
                                    : minLockupTimeInDays,
                                )
                              },
                            }}
                          />
                        )}
                        <Box
                          padding="4"
                          borderTopColor="gray.true-700"
                          borderTopWidth={1}
                        >
                          <Box
                            flexDirection="row"
                            justifyContent="space-between"
                          >
                            <Text variant="textSmMedium" color="gray.600">
                              {t('gov.positions.initialVotePowerMult')}:
                            </Text>
                            <Text variant="textSmMedium" color="primaryText">
                              {lockupMultiplier}x
                            </Text>
                          </Box>
                          <Box
                            flexDirection="row"
                            backgroundColor="secondaryText"
                            borderRadius="2xl"
                            overflow="hidden"
                            marginTop="2"
                          >
                            <Box
                              flexDirection="row"
                              height={6}
                              width={`${lockupMultiplier}%`}
                              backgroundColor="blue.light-500"
                            />
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  {showLockupKindInfo && (
                    <Box flexGrow={1} justifyContent="center">
                      {lockupKindOptions.map((type) => (
                        <Box key={type.value} justifyContent="center">
                          <Text
                            textAlign="left"
                            variant="textLgMedium"
                            adjustsFontSizeToFit
                          >
                            {type.display}
                          </Text>
                          {lockupInfosByType[type.value].map((info, idx) => (
                            <Text
                              // eslint-disable-next-line react/no-array-index-key
                              key={`info-${idx}`}
                              variant="textSmMedium"
                              color="secondaryText"
                              marginBottom="4"
                            >
                              {info}
                            </Text>
                          ))}
                        </Box>
                      ))}
                    </Box>
                  )}
                </ScrollView>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          )}
          {step === 2 && (
            <Box flexGrow={1} justifyContent="center">
              {!loading && (
                <>
                  <Text
                    textAlign="left"
                    variant="textLgMedium"
                    adjustsFontSizeToFit
                  >
                    {t('gov.transactions.delegatePosition')}
                  </Text>
                  <Text
                    variant="textSmMedium"
                    color="secondaryText"
                    marginBottom="2"
                  >
                    {t('gov.positions.selectSubDao')}
                  </Text>
                  <Box
                    borderRadius="2xl"
                    backgroundColor="secondaryBackground"
                    padding="3"
                    marginBottom="4"
                  >
                    <Text variant="textXsRegular">
                      {t('gov.positions.delegateBlurb')}
                    </Text>
                  </Box>
                </>
              )}
              {loading && (
                <Box justifyContent="center" alignItems="center">
                  <CircleLoader loaderSize={20} />
                  <Text
                    variant="textSmMedium"
                    color="secondaryText"
                    marginTop="3"
                  >
                    {t('gov.positions.fetchingSubDaos')}
                  </Text>
                </Box>
              )}
              <Box>
                {subDaos && (
                  <TouchableOpacityBox
                    borderRadius="2xl"
                    backgroundColor={
                      !selectedSubDaoPk ? 'secondaryBackground' : 'bg.tertiary'
                    }
                    onPress={() => setSelectedSubDaoPk(null)}
                  >
                    <Box flexDirection="row" padding="3" alignItems="center">
                      <Box
                        borderColor="base.black"
                        borderWidth={2}
                        borderRadius="full"
                      >
                        <HntIcon width={26} height={26} color="primaryText" />
                      </Box>
                      <Text
                        variant="textMdMedium"
                        color="primaryText"
                        marginLeft="4"
                      >
                        None
                      </Text>
                    </Box>
                  </TouchableOpacityBox>
                )}
                {subDaos
                  ?.sort((a, b) =>
                    a.dntMetadata.name.localeCompare(b.dntMetadata.name),
                  )
                  .map((subDao) => {
                    const isSelected = selectedSubDaoPk?.equals(subDao.pubkey)

                    return (
                      <TouchableOpacityBox
                        key={subDao.pubkey.toString()}
                        borderRadius="2xl"
                        marginTop="4"
                        backgroundColor={
                          isSelected ? 'secondaryBackground' : 'bg.tertiary'
                        }
                        onPress={() => setSelectedSubDaoPk(subDao.pubkey)}
                      >
                        <Box
                          flexDirection="row"
                          padding="3"
                          alignItems="center"
                        >
                          <Box
                            borderColor="base.black"
                            borderWidth={2}
                            borderRadius="full"
                          >
                            <TokenIcon
                              size={26}
                              img={subDao.dntMetadata.json?.image || ''}
                            />
                          </Box>
                          <Text
                            variant="textMdMedium"
                            color="primaryText"
                            marginLeft="4"
                          >
                            {subDao.dntMetadata.name}
                          </Text>
                        </Box>
                      </TouchableOpacityBox>
                    )
                  })}
              </Box>
            </Box>
          )}
          {showError && (
            <Box
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              paddingTop="3"
            >
              <Text variant="textXsMedium" color="error.500">
                {showError}
              </Text>
            </Box>
          )}
          {step === 1 && (
            <Box flexDirection="row" paddingTop="3">
              {!showLockupKindInfo ? (
                <ButtonPressable
                  flex={1}
                  fontSize={16}
                  borderRadius="full"
                  backgroundColor="base.white"
                  backgroundColorOpacityPressed={0.7}
                  backgroundColorDisabled="bg.tertiary"
                  backgroundColorDisabledOpacity={0.9}
                  titleColorDisabled="secondaryText"
                  title={
                    isSubmitting
                      ? ''
                      : {
                          lock: mint.equals(HNT_MINT)
                            ? t('generic.next')
                            : t('gov.transactions.lockTokens'),
                          extend: t('gov.transactions.extendPosition'),
                          split: t('gov.transactions.splitPosition'),
                        }[mode]
                  }
                  titleColor="base.black"
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
                    isSubmitting ? (
                      <CircleLoader color="primaryText" />
                    ) : undefined
                  }
                />
              ) : (
                <ButtonPressable
                  flex={1}
                  fontSize={16}
                  borderRadius="full"
                  backgroundColor="base.white"
                  backgroundColorOpacityPressed={0.7}
                  title="Back"
                  titleColor="base.black"
                  onPress={() => {
                    setShowLockupKindInfo(false)
                  }}
                />
              )}
            </Box>
          )}
          {step === 2 && (
            <Box flexDirection="row" paddingTop="3">
              <ButtonPressable
                flex={1}
                fontSize={16}
                borderRadius="full"
                backgroundColor="base.white"
                backgroundColorOpacityPressed={0.7}
                backgroundColorDisabled="bg.tertiary"
                backgroundColorDisabledOpacity={0.9}
                titleColorDisabled="secondaryText"
                title={isSubmitting ? '' : t('gov.transactions.lockTokens')}
                titleColor="base.black"
                onPress={handleSubmit}
                disabled={isSubmitting}
                TrailingComponent={
                  isSubmitting ? (
                    <CircleLoader color="primaryText" />
                  ) : undefined
                }
              />
            </Box>
          )}
        </BackScreen>
      </ReAnimatedBlurBox>
      <HNTKeyboard
        ref={hntKeyboardRef}
        mint={mint}
        networkFee={SOL_TXN_FEE}
        actionableAmount={
          maxLockupAmount && mintAcc
            ? toBN(maxLockupAmount, mintAcc.decimals)
            : undefined
        }
        onConfirmBalance={handleAmountChange}
      />
    </Portal>
  )
}

export default LockTokensModal
