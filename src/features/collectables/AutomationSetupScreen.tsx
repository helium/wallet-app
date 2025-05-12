import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useAutomateHotspotClaims } from '@helium/automation-hooks'
import {
  batchInstructionsToTxsWithPriorityFee,
  bulkSendTransactions,
  HNT_MINT,
  populateMissingDraftInfo,
  toVersionedTx,
} from '@helium/spl-utils'
import useHotspots from '@hooks/useHotspots'
import { useNavigation } from '@react-navigation/native'
import { TransactionInstruction } from '@solana/web3.js'
import { MAX_TRANSACTIONS_PER_SIGNATURE_BATCH } from '@utils/constants'
import { getBasePriorityFee } from '@utils/walletApiV2'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { MessagePreview } from '../../solana/MessagePreview'
import { useSolana } from '../../solana/SolanaProvider'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { CollectableNavigationProp } from './collectablesTypes'

type Schedule = 'daily' | 'weekly' | 'monthly'

const AutomationSetupScreen = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule>('daily')
  const [duration, setDuration] = useState('10')
  const { walletSignBottomSheetRef } = useWalletSign()
  const backEdges = ['top'] as Edge[]

  const { anchorProvider } = useSolana()
  const { totalHotspots, hotspotsWithMeta } = useHotspots()

  const hotspotsNeedingRecipient = useMemo(() => {
    return hotspotsWithMeta.filter(
      (hotspot) => !hotspot.rewardRecipients[HNT_MINT.toBase58()],
    ).length
  }, [hotspotsWithMeta])
  const {
    loading,
    error,
    execute,
    remove,
    hasExistingAutomation,
    currentSchedule,
    insufficientSol,
    rentFee,
    solFee,
    recipientFee,
    isOutOfSol,
  } = useAutomateHotspotClaims({
    schedule: selectedSchedule,
    duration: parseInt(duration, 10),
    totalHotspots: totalHotspots || 1,
    wallet: anchorProvider?.wallet?.publicKey,
    provider: anchorProvider,
    hotspotsNeedingRecipient,
  })

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

  const decideAndExecute = useCallback(
    async (
      header: string,
      message: string,
      instructions: TransactionInstruction[],
    ) => {
      if (!anchorProvider) {
        throw new Error('Anchor provider not found')
      }
      const transactions = await batchInstructionsToTxsWithPriorityFee(
        anchorProvider,
        instructions,
        {
          basePriorityFee: await getBasePriorityFee(),
          useFirstEstimateForAll: true,
          computeScaleUp: 1.4,
        },
      )
      const populatedTxs = await Promise.all(
        transactions.map((tx) =>
          populateMissingDraftInfo(anchorProvider.connection, tx),
        ),
      )
      const txs = populatedTxs.map((tx) => toVersionedTx(tx))
      const decision = await walletSignBottomSheetRef?.show({
        type: WalletStandardMessageTypes.signTransaction,
        url: '',
        header,
        renderer: () => <MessagePreview message={message} />,
        serializedTxs: txs.map((transaction) =>
          Buffer.from(transaction.serialize()),
        ),
      })

      if (!decision) {
        throw new Error('User rejected transaction')
      }

      if (decision) {
        await bulkSendTransactions(
          anchorProvider,
          transactions,
          undefined,
          10,
          [],
          MAX_TRANSACTIONS_PER_SIGNATURE_BATCH,
        )
      } else {
        throw new Error('User rejected transaction')
      }
    },
    [anchorProvider, walletSignBottomSheetRef],
  )

  const handleSave = useCallback(async () => {
    try {
      await execute({
        onInstructions: async (instructions) => {
          await decideAndExecute(
            t('automationScreen.setupAutomation'),
            t('automationScreen.setupAutomationMessage', {
              schedule: selectedSchedule,
              duration,
              rentFee,
              solFee: Math.max(solFee, 0),
              interval:
                selectedSchedule === 'daily'
                  ? 'days'
                  : selectedSchedule === 'weekly'
                  ? 'weeks'
                  : 'months',
            }),
            instructions,
          )
        },
      })
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }, [
    execute,
    navigation,
    decideAndExecute,
    t,
    selectedSchedule,
    duration,
    rentFee,
    solFee,
  ])

  const handleRemoveAutomation = useCallback(async () => {
    try {
      await remove({
        onInstructions: async (instructions) => {
          await decideAndExecute(
            t('automationScreen.removeAutomation'),
            t('automationScreen.removeAutomationMessage'),
            instructions,
          )
        },
      })
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }, [remove, navigation, t, decideAndExecute])

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
                marginBottom="xl"
              >
                <Text variant="subtitle4" color="grey300" marginBottom="s">
                  {t('automationScreen.schedule.running', {
                    schedule: t(
                      `automationScreen.schedule.${currentSchedule.schedule}`,
                    ).toLowerCase(),
                    time: currentSchedule.time,
                  })}
                </Text>
                <Text variant="subtitle4" color="grey300">
                  {t('automationScreen.nextRun', {
                    date: formatNextRunDate(currentSchedule.nextRun),
                  })}
                </Text>
              </Box>
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
                  <Box flexDirection="row" alignItems="center" marginBottom="s">
                    <TextInput
                      flex={1}
                      variant="transparent"
                      textInputProps={{
                        placeholder: duration,
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

          {error && (
            <Box
              flexDirection="row"
              backgroundColor="surfaceSecondary"
              borderRadius="l"
              padding="m"
              marginBottom="m"
            >
              <Text variant="body3Medium" color="red500">
                {error.message}
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

          {!hasExistingAutomation && (
            <Box
              backgroundColor="surfaceSecondary"
              borderRadius="l"
              padding="m"
              marginBottom="m"
            >
              <Box
                flexDirection="row"
                justifyContent="space-between"
                marginBottom="s"
              >
                <Text variant="body2" color="grey400">
                  {t('automationScreen.reclaimableSol')}
                </Text>
                <Text variant="body2Medium" color="grey200">
                  {rentFee} SOL
                </Text>
              </Box>
              {totalHotspots && hotspotsNeedingRecipient > 0 && (
                <Box
                  flexDirection="row"
                  justifyContent="space-between"
                  marginBottom="s"
                >
                  <Text variant="body2" color="grey400">
                    {t('automationScreen.recipientSol')}
                  </Text>
                  <Text variant="body2Medium" color="grey200">
                    {recipientFee} SOL
                  </Text>
                </Box>
              )}
              <Box flexDirection="row" justifyContent="space-between">
                <Text variant="body2" color="grey400">
                  {t('automationScreen.transactionFees')}
                </Text>
                <Text variant="body2Medium" color="grey200">
                  {Math.max(solFee, 0)} SOL
                </Text>
              </Box>
            </Box>
          )}

          {hasExistingAutomation ? (
            <ButtonPressable
              title={
                loading ? undefined : t('automationScreen.removeAutomation')
              }
              backgroundColor="grey200"
              backgroundColorDisabled="grey400"
              backgroundColorDisabledOpacity={0.5}
              backgroundColorOpacityPressed={0.7}
              titleColor="error"
              disabled={loading}
              TrailingComponent={
                loading ? (
                  <CircleLoader loaderSize={20} color="black" />
                ) : undefined
              }
              onPress={handleRemoveAutomation}
              borderRadius="round"
              padding="m"
              marginBottom="m"
            />
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
