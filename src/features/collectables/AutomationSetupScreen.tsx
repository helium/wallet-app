import { HNT_MINT } from '@helium/spl-utils'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useAutomation, useFundingEstimate } from '@hooks/useAutomation'
import useHotspots from '@hooks/useHotspots'
import { useNavigation } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { twMerge } from '@ui/twMerge'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import BackHeader from './components/BackHeader'
import { CollectableNavigationProp } from './collectablesTypes'

const SafeArea = withUniwind(SafeAreaView)

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
    <View className="mb-4 rounded-[12px] bg-background p-4">
      <View className="mb-2 flex-row justify-between">
        <Text className="text-muted-foreground">
          {t('automationScreen.reclaimableSol')}
        </Text>
        <Text className="font-medium">{estimate.rentFee.toFixed(4)} SOL</Text>
      </View>
      {showRecipientFee && estimate.recipientFee > 0 && (
        <View className="mb-2 flex-row justify-between">
          <Text className="text-muted-foreground">
            {t('automationScreen.recipientSol')}
          </Text>
          <Text className="font-medium">
            {estimate.recipientFee.toFixed(4)} SOL
          </Text>
        </View>
      )}
      <View className="mb-2 flex-row justify-between">
        <Text className="text-muted-foreground">
          {t('automationScreen.transactionFees')}
        </Text>
        <Text className="font-medium">
          {estimate.operationalSol.toFixed(4)} SOL
        </Text>
      </View>
      <View className="flex-row justify-between">
        <Text className="font-medium">
          {t('automationScreen.totalFunding')}
        </Text>
        <Text className="font-medium">
          {estimate.totalSolNeeded.toFixed(4)} SOL
        </Text>
      </View>
    </View>
  )
}

const ScheduleOption = ({
  schedule,
  index,
  selected,
  onSelect,
}: {
  schedule: Schedule
  index: number
  selected: boolean
  onSelect: (schedule: Schedule) => void
}) => {
  const { t } = useTranslation()
  return (
    <PressableScale
      onPress={() => onSelect(schedule)}
      feedback="opacity"
      accessibilityState={{ selected }}
      className={twMerge(
        'flex-1 items-center justify-center rounded-[20px] p-2',
        selected ? 'bg-primary' : 'bg-transparent',
        index > 0 && 'ml-0.5',
      )}
    >
      <Text
        className={twMerge(
          'text-center font-medium',
          selected ? 'text-primary-foreground' : 'text-muted-foreground',
        )}
      >
        {t(`automationScreen.schedule.${schedule}`)}
      </Text>
    </PressableScale>
  )
}

const DurationInput = ({
  duration,
  unitLabel,
  onChange,
}: {
  duration: string
  unitLabel: string
  onChange: (text: string) => void
}) => (
  <View className="mb-4 flex-row items-center">
    <Input
      className="w-auto flex-1"
      placeholder={duration || '------'}
      onChangeText={onChange}
      value={duration}
      keyboardType="decimal-pad"
      returnKeyType="done"
    />
    <Text size="base" className="ms-2 font-medium text-muted-foreground">
      {unitLabel}
    </Text>
  </View>
)

const AutomationSetupScreen = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule>('daily')
  const [duration, setDuration] = useState('10')

  const { totalHotspots, hotspotsWithMeta } = useHotspots()

  const {
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

  const hotspotsNeedingRecipient = hotspotsWithMeta.filter(
    (hotspot) => !hotspot.rewardRecipients[HNT_MINT.toBase58()],
  ).length

  const error =
    createAutomationError ||
    fundAutomationError ||
    closeAutomationError ||
    estimate.estimateError

  // Calculate insufficient SOL for create flow
  // This would need to check actual wallet balance - simplified for now
  const insufficientSol = false

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

  const handleScheduleSelect = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
  }

  const handleSave = async () => {
    if (!totalHotspots || !estimate.estimate) return

    try {
      await createAutomation({
        schedule: selectedSchedule,
        duration: parseInt(duration, 10),
        estimate: {
          rentFee: estimate.estimate.rentFee,
          recipientFee: estimate.estimate.recipientFee,
          operationalSol: estimate.estimate.operationalSol,
        },
      })
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }

  const handleRemoveAutomation = async () => {
    try {
      await closeAutomation()
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }

  const handleFundAutomation = async () => {
    if (!duration || !estimate.estimate) return

    try {
      await fundAutomation({
        additionalDuration: parseInt(duration, 10),
        currentSchedule,
        estimate: { totalSolNeeded: estimate.estimate.totalSolNeeded },
      })
      setDuration('')
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }

  const formatNextRunDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <SafeArea edges={['top']} className="flex-1 bg-background">
      <BackHeader onClose={() => navigation.goBack()} />
      <View className="flex-1 bg-secondary p-2">
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow"
        >
          <View className="flex-1 p-6">
            <Text size="xl" className="mb-2 font-medium">
              {t('automationScreen.title')}
            </Text>
            <Text className="mb-8 font-medium text-muted-foreground">
              {t('automationScreen.description')}
            </Text>

            {hasExistingAutomation && currentSchedule ? (
              <>
                <Text size="base" className="mb-4 font-medium">
                  {t('automationScreen.currentAutomation')}
                </Text>
                <View className="mb-6 rounded-[20px] bg-background p-6">
                  <Text className="mb-2 font-medium text-muted-foreground">
                    {t('automationScreen.schedule.running', {
                      schedule: t(
                        `automationScreen.schedule.${currentSchedule.schedule}`,
                      ).toLowerCase(),
                      time: currentSchedule.time,
                    })}
                  </Text>
                  <Text className="mb-4 font-medium text-muted-foreground">
                    {t('automationScreen.nextRun', {
                      date: formatNextRunDate(
                        new Date(currentSchedule.nextRun),
                      ),
                    })}
                  </Text>
                  {remainingClaims !== undefined && (
                    <View className="mb-2 flex-row justify-between">
                      <Text className="font-medium text-muted-foreground">
                        {t('automationScreen.remainingClaims')}
                      </Text>
                      <Text className="font-medium">{remainingClaims}</Text>
                    </View>
                  )}
                  {fundingPeriodInfo && (
                    <>
                      <View className="mb-2 flex-row justify-between">
                        <Text className="font-medium text-muted-foreground">
                          {t('automationScreen.cronJobBalance')}
                        </Text>
                        <Text className="font-medium">
                          {(
                            parseFloat(cronJobBalance || '0') / LAMPORTS_PER_SOL
                          ).toFixed(4)}{' '}
                          SOL
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <Text className="font-medium text-muted-foreground">
                          {t('automationScreen.pdaWalletBalance')}
                        </Text>
                        <Text className="font-medium">
                          {(
                            parseFloat(pdaWalletBalance || '0') /
                            LAMPORTS_PER_SOL
                          ).toFixed(4)}{' '}
                          SOL
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                {/* Fund Automation Section */}
                <Text size="base" className="mb-4 font-medium">
                  {t('automationScreen.fundAutomation')}
                </Text>
                <Text className="mb-2 font-medium text-muted-foreground">
                  {t('automationScreen.enterAdditionalDuration')}
                </Text>
                <DurationInput
                  duration={duration}
                  unitLabel={getUnitLabel()}
                  onChange={handleDurationChange}
                />

                {estimate.estimate && duration && (
                  <EstimateDisplay
                    estimate={estimate.estimate}
                    showRecipientFee
                  />
                )}
                {estimate.estimateLoading && <Spinner className="mb-4" />}
              </>
            ) : (
              <>
                <Text className="mb-4 font-medium">
                  {t('automationScreen.selectSchedule')}
                </Text>

                <View className="mb-6 flex-row rounded-[20px] bg-background p-0.5">
                  <ScheduleOption
                    schedule="daily"
                    index={0}
                    selected={selectedSchedule === 'daily'}
                    onSelect={handleScheduleSelect}
                  />
                  <ScheduleOption
                    schedule="weekly"
                    index={1}
                    selected={selectedSchedule === 'weekly'}
                    onSelect={handleScheduleSelect}
                  />
                  <ScheduleOption
                    schedule="monthly"
                    index={2}
                    selected={selectedSchedule === 'monthly'}
                    onSelect={handleScheduleSelect}
                  />
                </View>

                {selectedSchedule && (
                  <>
                    <Text className="mb-2 font-medium">
                      {t('automationScreen.enterDuration')}
                    </Text>
                    <DurationInput
                      duration={duration}
                      unitLabel={getUnitLabel()}
                      onChange={handleDurationChange}
                    />
                  </>
                )}
              </>
            )}

            <View className="flex-1" />

            {(error || statusError) && (
              <View className="mb-4 flex-row rounded-[12px] bg-background p-4">
                <Text size="xs" className="font-medium text-destructive">
                  {error instanceof Error
                    ? error.message
                    : statusError instanceof Error
                      ? statusError.message
                      : String(error || statusError)}
                </Text>
              </View>
            )}
            {isOutOfSol && (
              <View className="mt-4 rounded-[12px] bg-background p-4">
                <Text size="xs" className="font-medium text-destructive">
                  {t('automationScreen.outOfSol')}
                </Text>
              </View>
            )}

            {!hasExistingAutomation && estimate.estimate && duration && (
              <EstimateDisplay
                estimate={estimate.estimate}
                showRecipientFee={
                  !!totalHotspots && hotspotsNeedingRecipient > 0
                }
              />
            )}
            {!hasExistingAutomation && estimate.estimateLoading && (
              <Spinner className="mb-4" />
            )}

            {hasExistingAutomation ? (
              <>
                {duration && (
                  <Button
                    variant="cta"
                    size="dashboard"
                    className="mb-4 w-full"
                    disabled={
                      !duration || fundAutomationLoading || !estimate.estimate
                    }
                    onPress={() =>
                      void handleFundAutomation().catch(console.error)
                    }
                  >
                    {fundAutomationLoading ? (
                      <Spinner size="small" colorClassName="accent-white" />
                    ) : (
                      t('automationScreen.fundAutomation')
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="dashboard"
                  className="mb-4 w-full"
                  disabled={closeAutomationLoading}
                  onPress={() =>
                    void handleRemoveAutomation().catch(console.error)
                  }
                >
                  {closeAutomationLoading ? (
                    <Spinner size="small" colorClassName="accent-destructive" />
                  ) : (
                    <Text className="font-medium text-destructive">
                      {t('automationScreen.removeAutomation')}
                    </Text>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="cta"
                size="dashboard"
                className="mb-4 w-full"
                disabled={
                  insufficientSol ||
                  !selectedSchedule ||
                  !duration ||
                  createAutomationLoading ||
                  !estimate.estimate
                }
                onPress={() => void handleSave().catch(console.error)}
              >
                {createAutomationLoading ? (
                  <Spinner size="small" colorClassName="accent-white" />
                ) : insufficientSol ? (
                  t('generic.insufficientSol')
                ) : (
                  t('generic.save')
                )}
              </Button>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeArea>
  )
}

export default AutomationSetupScreen
