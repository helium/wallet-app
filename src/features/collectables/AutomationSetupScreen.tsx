import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { CollectableNavigationProp } from './collectablesTypes'
import { useAutomateHotspotClaims } from '../../hooks/useAutomateHotspotClaims'
import { useWalletSign } from '../../solana/WalletSignProvider'
import { MessagePreview } from '../../solana/MessagePreview'
import { WalletStandardMessageTypes } from '../../solana/walletSignBottomSheetTypes'

type Schedule = 'daily' | 'weekly' | 'monthly'

const AutomationSetupScreen = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule>('daily')
  const [duration, setDuration] = useState('10')
  const { walletSignBottomSheetRef } = useWalletSign()
  const backEdges = ['top'] as Edge[]

  const {
    loading,
    error,
    execute,
    remove,
    hasExistingAutomation
  } = useAutomateHotspotClaims(selectedSchedule, parseInt(duration, 10))

  const handleDurationChange = (text: string) => {
    // Remove any non-numeric characters
    const numericValue = text.replace(/[^0-9]/g, '')

    // Convert to number and ensure it's positive
    const number = parseInt(numericValue, 10)

    // Only update if it's a valid positive number or empty string
    if (numericValue === '' || (number > 0 && number <= 999)) {
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
    try {
      await execute({
        onInstructions: async (instructions) => {
          const decision = await walletSignBottomSheetRef?.show({
            type: WalletStandardMessageTypes.signTransaction,
            url: '',
            header: t('automationScreen.setupAutomation'),
            renderer: () => (
              <MessagePreview 
                message={t('automationScreen.setupAutomationMessage', {
                  schedule: selectedSchedule,
                  duration
                })} 
              />
            ),
            serializedTxs: instructions.map((tx) => Buffer.from(tx.serialize())),
          })

          if (!decision) {
            throw new Error('User rejected transaction')
          }
        }
      })
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }, [execute, navigation, selectedSchedule, duration, walletSignBottomSheetRef, t])

  const handleRemoveAutomation = useCallback(async () => {
    try {
      await remove({
        onInstructions: async (instructions) => {
          const decision = await walletSignBottomSheetRef?.show({
            type: WalletStandardMessageTypes.signTransaction,
            url: '',
            header: t('automationScreen.removeAutomation'),
            renderer: () => (
              <MessagePreview 
                message={t('automationScreen.removeAutomationMessage')} 
              />
            ),
            serializedTxs: instructions.map((tx) => Buffer.from(tx.serialize())),
          })

          if (!decision) {
            throw new Error('User rejected transaction')
          }
        }
      })
      navigation.goBack()
    } catch (e) {
      console.error(e)
    }
  }, [remove, navigation, walletSignBottomSheetRef, t])

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
      padding="m"
      borderRadius="xl"
      marginLeft={index > 0 ? 'xxs' : 'none'}
    >
      <Text
        variant="body1Medium"
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
          <Text variant="h0" marginBottom="m">
            {t('automationScreen.title')}
          </Text>
          <Text variant="subtitle1" color="grey500" marginBottom="xl">
            {t('automationScreen.description')}
          </Text>

          <Text variant="h3" marginBottom="m">
            {t('automationScreen.selectSchedule')}
          </Text>

          <Box
            flexDirection="row"
            backgroundColor="black"
            borderRadius="xl"
            padding="xxs"
          >
            <ScheduleOption schedule="daily" index={0} />
            <ScheduleOption schedule="weekly" index={1} />
            <ScheduleOption schedule="monthly" index={2} />
          </Box>

          {selectedSchedule && (
            <>
              <Text variant="h3" marginBottom="m" marginTop="l">
                {t('automationScreen.enterDuration')}
              </Text>
              <Box flexDirection="row" alignItems="center" marginBottom="xl">
                <TextInput
                  flex={1}
                  variant="transparent"
                  textInputProps={{
                    placeholder: duration,
                    onChangeText: handleDurationChange,
                    value: duration,
                    keyboardType: 'number-pad',
                    maxLength: 5,
                    returnKeyType: 'done',
                  }}
                />
                <Text variant="subtitle1" color="grey500" marginStart="s">
                  {getUnitLabel()}
                </Text>
              </Box>
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

          <ButtonPressable
            title={t('generic.save')}
            backgroundColor="white"
            backgroundColorOpacityPressed={0.7}
            titleColor="black"
            disabled={!selectedSchedule || !duration || loading}
            loading={loading}
            onPress={handleSave}
            borderRadius="round"
            padding="m"
            marginBottom="m"
          />

          {hasExistingAutomation && (
            <ButtonPressable
              title={t('automationScreen.removeAutomation')}
              backgroundColor="surfaceSecondary"
              backgroundColorOpacityPressed={0.7}
              titleColor="error"
              disabled={loading}
              loading={loading}
              onPress={handleRemoveAutomation}
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
