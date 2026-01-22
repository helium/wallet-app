import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { HNT_MINT } from '@helium/spl-utils'
import { LAMPORTS_PER_SOL, VersionedTransaction } from '@solana/web3.js'
import { useAutomation, useFundingEstimate } from '@hooks/useAutomation'
import { useSubmitAndAwait } from '@hooks/useSubmitAndAwait'
import useHotspots from '@hooks/useHotspots'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { useSolana } from '../../solana/SolanaProvider'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { MessagePreview } from '../../solana/MessagePreview'
import { CollectableNavigationProp } from './collectablesTypes'

type Schedule = 'daily' | 'weekly' | 'monthly'

interface EstimateDisplayProps {
  estimate: {
    rentFee: number
    recipientFee: number
    operationalSol: number
    totalSolNeeded: number
  }
  showRecipientFee: boolean
}

const EstimateDisplay = ({
  estimate,
  showRecipientFee,
}: EstimateDisplayProps) => {
  const { t } = useTranslation()
  return (
    <Box
      backgroundColor="surfaceSecondary"
      borderRadius="l"
      padding="m"
      marginBottom="m"
    >
      <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
        <Text variant="body2" color="grey400">
          {t('automationScreen.reclaimableSol')}
        </Text>
        <Text variant="body2Medium" color="grey200">
          {estimate.rentFee.toFixed(4)} SOL
        </Text>
      </Box>
      {showRecipientFee && estimate.recipientFee > 0 && (
        <Box
          flexDirection="row"
          justifyContent="space-between"
          marginBottom="s"
        >
          <Text variant="body2" color="grey400">
            {t('automationScreen.recipientSol')}
          </Text>
          <Text variant="body2Medium" color="grey200">
            {estimate.recipientFee.toFixed(4)} SOL
          </Text>
        </Box>
      )}
      <Box flexDirection="row" justifyContent="space-between" marginBottom="s">
        <Text variant="body2" color="grey400">
          {t('automationScreen.transactionFees')}
        </Text>
        <Text variant="body2Medium" color="grey200">
          {estimate.operationalSol.toFixed(4)} SOL
        </Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between">
        <Text variant="body2Medium" color="grey200">
          {t('automationScreen.totalFunding')}
        </Text>
        <Text variant="body2Medium" color="white">
          {estimate.totalSolNeeded.toFixed(4)} SOL
        </Text>
      </Box>
    </Box>
  )
}

const AutomationSetupScreen = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule>('daily')
  const [duration, setDuration] = useState('10')
  const backEdges = ['top'] as Edge[]

  const { anchorProvider } = useSolana()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { submitAndAwait } = useSubmitAndAwait()
  const { totalHotspots, hotspotsWithMeta } = useHotspots()

  const {
    statusLoading,
    statusError,
    hasExistingAutomation,
    isOutOfSol,
    currentSchedule,
    remainingClaims,
    fundingPeriodInfo,
    cronJobBalance,
    pdaWalletBalance,
    createAutomation,
    createAutomationLoading,
    createAutomationError,
    fundAutomation,
    fundAutomationLoading,
    fundAutomationError,
    closeAutomation,
    closeAutomationLoading,
    closeAutomationError,
  } = useAutomation()

  // Get funding estimate (used for both create and fund flows)
  const estimate = useFundingEstimate(duration)

  const hotspotsNeedingRecipient = useMemo(() => {
    return hotspotsWithMeta.filter(
      (hotspot) => !hotspot.rewardRecipients[HNT_MINT.toBase58()],
    ).length
  }, [hotspotsWithMeta])

  const loading =
    createAutomationLoading ||
    fundAutomationLoading ||
    closeAutomationLoading ||
    statusLoading

  const error =
    createAutomationError || fundAutomationError || closeAutomationError

  // Calculate insufficient SOL for create flow
  const insufficientSol = useMemo(() => {
    if (!estimate.estimate) return false
    // This would need to check actual wallet balance - simplified for now
    return false
  }, [estimate.estimate])

  const handleDurationChange = (text: string) => {
    // Remove any non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '')

    // Convert to number and ensure it's positive
    const number = parseInt(numericValue, 10)

    // Only update if it's a valid positive number or empty string
    if (numericValue === '' || number > 0) {
      setDuration(numericValue)
    }
  }

  const getUnitLabel = () => {
    if (!selectedSchedule) return ''
    switch (selectedSchedule) {
      case 'daily':
        return t('automationScreen.duration.days')
      case 'weekly':
        return t('automationScreen.duration.weeks')
      case 'monthly':
        return t('automationScreen.duration.months')
    }
  }

  const handleScheduleSelect = useCallback((schedule: Schedule) => {
    setSelectedSchedule(schedule)
  }, [])

  const handleSave = useCallback(async () => {
    if (!anchorProvider || !walletSignBottomSheetRef || !totalHotspots) return

    try {
      const { transactionData } = await createAutomation({
        schedule: selectedSchedule,
        duration: parseInt(duration, 10),
        totalHotspots,
      })

      // Deserialize transactions for preview
      const transactions = transactionData.transactions.map(
        ({ serializedTransaction }) =>
          VersionedTransaction.deserialize(
            Buffer.from(serializedTransaction, 'base64'),
          ),
      )

      // Show preview
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('automationScreen.setupAutomation'),
        renderer: () =>
          React.createElement(MessagePreview, {
            message: t('automationScreen.setupAutomationMessage', {
              schedule: selectedSchedule,
              duration,
              rentFee: estimate.estimate?.rentFee ?? 0,
              recipientFee: estimate.estimate?.recipientFee ?? 0,
              solFee: Math.max(estimate.estimate?.operationalSol ?? 0, 0),
              interval:
                selectedSchedule === 'daily'
                  ? 'days'
                  : selectedSchedule === 'weekly'
                  ? 'weeks'
                  : 'months',
            }),
          }),
        suppressWarnings: false,
        serializedTxs: transactions.map((tx) => Buffer.from(tx.serialize())),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign, submit, and wait for confirmation
      await submitAndAwait({ transactionData })
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }, [
    anchorProvider,
    walletSignBottomSheetRef,
    totalHotspots,
    createAutomation,
    selectedSchedule,
    duration,
    estimate.estimate,
    submitAndAwait,
    navigation,
    t,
  ])

  const handleRemoveAutomation = useCallback(async () => {
    if (!anchorProvider || !walletSignBottomSheetRef) return

    try {
      const { transactionData } = await closeAutomation()

      // Deserialize transactions for preview
      const transactions = transactionData.transactions.map(
        ({ serializedTransaction }) =>
          VersionedTransaction.deserialize(
            Buffer.from(serializedTransaction, 'base64'),
          ),
      )

      // Show preview
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('automationScreen.removeAutomation'),
        renderer: () =>
          React.createElement(MessagePreview, {
            message: t('automationScreen.removeAutomationMessage'),
          }),
        suppressWarnings: false,
        serializedTxs: transactions.map((tx) => Buffer.from(tx.serialize())),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign, submit, and wait for confirmation
      await submitAndAwait({ transactionData })
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }, [
    anchorProvider,
    walletSignBottomSheetRef,
    closeAutomation,
    submitAndAwait,
    navigation,
    t,
  ])

  const handleFundAutomation = useCallback(async () => {
    if (!anchorProvider || !walletSignBottomSheetRef || !duration) return

    try {
      const { transactionData } = await fundAutomation({
        additionalDuration: parseInt(duration, 10),
      })

      // Deserialize transactions for preview
      const transactions = transactionData.transactions.map(
        ({ serializedTransaction }) =>
          VersionedTransaction.deserialize(
            Buffer.from(serializedTransaction, 'base64'),
          ),
      )

      // Show preview
      const decision = await walletSignBottomSheetRef.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header: t('automationScreen.fundAutomation'),
        renderer: () =>
          React.createElement(MessagePreview, {
            message: t('automationScreen.fundAutomationMessage', {
              duration,
              interval:
                currentSchedule?.schedule === 'daily'
                  ? 'days'
                  : currentSchedule?.schedule === 'weekly'
                  ? 'weeks'
                  : 'months',
              totalFunding: estimate.estimate?.totalSolNeeded ?? 0,
            }),
          }),
        suppressWarnings: false,
        serializedTxs: transactions.map((tx) => Buffer.from(tx.serialize())),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      // Sign, submit, and wait for confirmation
      await submitAndAwait({ transactionData })
      setDuration('')
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }, [
    anchorProvider,
    walletSignBottomSheetRef,
    duration,
    fundAutomation,
    estimate.estimate,
    currentSchedule,
    submitAndAwait,
    navigation,
    t,
  ])

  const formatNextRunDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const ScheduleOption = ({
    schedule,
    index,
  }: {
    schedule: Schedule
    index: number
  }) => (
    <TouchableOpacityBox
      onPress={() => handleScheduleSelect(schedule)}
      backgroundColor={selectedSchedule === schedule ? 'white' : 'black'}
      marginBottom="none"
      alignItems="center"
      justifyContent="center"
      flex={1}
      padding="s"
      borderRadius="xl"
      marginLeft={index > 0 ? 'xxs' : 'none'}
    >
      <Text
        variant="subtitle4"
        color={selectedSchedule === schedule ? 'black' : 'grey300'}
        textAlign="center"
      >
        {t(`automationScreen.schedule.${schedule}`)}
      </Text>
    </TouchableOpacityBox>
  )

  return (
    <BackScreen
      padding="s"
      backgroundColor="secondaryBackground"
      edges={backEdges}
      onClose={() => navigation.goBack()}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Box flex={1} padding="l">
          <Text variant="subtitle1" marginBottom="s">
            {t('automationScreen.title')}
          </Text>
          <Text variant="subtitle4" color="grey400" marginBottom="xl">
            {t('automationScreen.description')}
          </Text>

          {hasExistingAutomation && currentSchedule ? (
            <>
              <Text variant="subtitle3" marginBottom="m">
                {t('automationScreen.currentAutomation')}
              </Text>
              <Box
                backgroundColor="black"
                borderRadius="xl"
                padding="l"
                marginBottom="l"
              >
                <Text variant="subtitle4" color="grey300" marginBottom="s">
                  {t('automationScreen.schedule.running', {
                    schedule: t(
                      `automationScreen.schedule.${currentSchedule.schedule}`,
                    ).toLowerCase(),
                    time: currentSchedule.time,
                  })}
                </Text>
                <Text variant="subtitle4" color="grey300" marginBottom="m">
                  {t('automationScreen.nextRun', {
                    date: formatNextRunDate(new Date(currentSchedule.nextRun)),
                  })}
                </Text>
                {remainingClaims !== undefined && (
                  <Box
                    flexDirection="row"
                    justifyContent="space-between"
                    marginBottom="s"
                  >
                    <Text variant="subtitle4" color="grey400">
                      {t('automationScreen.remainingClaims')}
                    </Text>
                    <Text variant="subtitle4" color="grey200">
                      {remainingClaims}
                    </Text>
                  </Box>
                )}
                {fundingPeriodInfo && (
                  <>
                    <Box
                      flexDirection="row"
                      justifyContent="space-between"
                      marginBottom="s"
                    >
                      <Text variant="subtitle4" color="grey400">
                        {t('automationScreen.cronJobBalance')}
                      </Text>
                      <Text variant="subtitle4" color="grey200">
                        {(
                          parseFloat(cronJobBalance || '0') / LAMPORTS_PER_SOL
                        ).toFixed(4)}{' '}
                        SOL
                      </Text>
                    </Box>
                    <Box flexDirection="row" justifyContent="space-between">
                      <Text variant="subtitle4" color="grey400">
                        {t('automationScreen.pdaWalletBalance')}
                      </Text>
                      <Text variant="subtitle4" color="grey200">
                        {(
                          parseFloat(pdaWalletBalance || '0') / LAMPORTS_PER_SOL
                        ).toFixed(4)}{' '}
                        SOL
                      </Text>
                    </Box>
                  </>
                )}
              </Box>

              {/* Fund Automation Section */}
              <Text variant="subtitle3" marginBottom="m">
                {t('automationScreen.fundAutomation')}
              </Text>
              <Text variant="subtitle4" color="grey400" marginBottom="s">
                {t('automationScreen.enterAdditionalDuration')}
              </Text>
              <Box flexDirection="row" alignItems="center" marginBottom="m">
                <TextInput
                  flex={1}
                  variant="transparent"
                  textInputProps={{
                    placeholder: duration || '------',
                    onChangeText: handleDurationChange,
                    value: duration,
                    keyboardType: 'decimal-pad',
                    returnKeyType: 'done',
                  }}
                />
                <Text variant="subtitle3" color="grey400" marginStart="s">
                  {getUnitLabel()}
                </Text>
              </Box>

              {estimate.estimate && duration && (
                <EstimateDisplay
                  estimate={estimate.estimate}
                  showRecipientFee
                />
              )}
            </>
          ) : (
            <>
              <Text variant="subtitle4" marginBottom="m">
                {t('automationScreen.selectSchedule')}
              </Text>

              <Box
                flexDirection="row"
                backgroundColor="black"
                borderRadius="xl"
                padding="xxs"
                marginBottom="l"
              >
                <ScheduleOption schedule="daily" index={0} />
                <ScheduleOption schedule="weekly" index={1} />
                <ScheduleOption schedule="monthly" index={2} />
              </Box>

              {selectedSchedule && (
                <>
                  <Text variant="subtitle4" marginBottom="s">
                    {t('automationScreen.enterDuration')}
                  </Text>
                  <Box flexDirection="row" alignItems="center" marginBottom="m">
                    <TextInput
                      flex={1}
                      variant="transparent"
                      textInputProps={{
                        placeholder: duration || '------',
                        onChangeText: handleDurationChange,
                        value: duration,
                        keyboardType: 'decimal-pad',
                        returnKeyType: 'done',
                      }}
                    />
                    <Text variant="subtitle3" color="grey400" marginStart="s">
                      {getUnitLabel()}
                    </Text>
                  </Box>
                </>
              )}
            </>
          )}

          <Box flex={1} />

          {(error || statusError) && (
            <Box
              flexDirection="row"
              backgroundColor="surfaceSecondary"
              borderRadius="l"
              padding="m"
              marginBottom="m"
            >
              <Text variant="body3Medium" color="red500">
                {error instanceof Error
                  ? error.message
                  : statusError instanceof Error
                  ? statusError.message
                  : String(error || statusError)}
              </Text>
            </Box>
          )}
          {isOutOfSol && (
            <Box
              backgroundColor="surfaceSecondary"
              borderRadius="l"
              padding="m"
              marginTop="m"
            >
              <Text variant="body3Medium" color="red500">
                {t('automationScreen.outOfSol')}
              </Text>
            </Box>
          )}

          {!hasExistingAutomation && estimate.estimate && duration && (
            <EstimateDisplay
              estimate={estimate.estimate}
              showRecipientFee={!!totalHotspots && hotspotsNeedingRecipient > 0}
            />
          )}

          {hasExistingAutomation ? (
            <>
              {duration && (
                <ButtonPressable
                  title={
                    fundAutomationLoading
                      ? undefined
                      : t('automationScreen.fundAutomation')
                  }
                  backgroundColor="white"
                  backgroundColorDisabled="grey400"
                  backgroundColorDisabledOpacity={0.5}
                  backgroundColorOpacityPressed={0.7}
                  titleColorDisabled="secondaryText"
                  titleColor="black"
                  disabled={!duration || fundAutomationLoading}
                  TrailingComponent={
                    fundAutomationLoading ? (
                      <CircleLoader loaderSize={20} color="black" />
                    ) : undefined
                  }
                  onPress={handleFundAutomation}
                  borderRadius="round"
                  padding="m"
                  marginBottom="m"
                />
              )}
              <ButtonPressable
                title={
                  closeAutomationLoading
                    ? undefined
                    : t('automationScreen.removeAutomation')
                }
                backgroundColor="grey200"
                backgroundColorDisabled="grey400"
                backgroundColorDisabledOpacity={0.5}
                backgroundColorOpacityPressed={0.7}
                titleColor="error"
                disabled={closeAutomationLoading}
                TrailingComponent={
                  closeAutomationLoading ? (
                    <CircleLoader loaderSize={20} color="black" />
                  ) : undefined
                }
                onPress={handleRemoveAutomation}
                borderRadius="round"
                padding="m"
                marginBottom="m"
              />
            </>
          ) : (
            <ButtonPressable
              title={
                insufficientSol
                  ? t('generic.insufficientSol')
                  : loading
                  ? undefined
                  : t('generic.save')
              }
              backgroundColor="white"
              backgroundColorDisabled="grey400"
              backgroundColorDisabledOpacity={0.5}
              backgroundColorOpacityPressed={0.7}
              titleColorDisabled="secondaryText"
              titleColor="black"
              disabled={
                insufficientSol || !selectedSchedule || !duration || loading
              }
              TrailingComponent={
                loading ? (
                  <CircleLoader loaderSize={20} color="black" />
                ) : undefined
              }
              onPress={handleSave}
              borderRadius="round"
              padding="m"
              marginBottom="m"
            />
          )}
        </Box>
      </ScrollView>
    </BackScreen>
  )
}

export default AutomationSetupScreen
