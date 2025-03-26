import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { CollectableNavigationProp } from './collectablesTypes'

type Schedule = 'daily' | 'weekly' | 'monthly'

const AutomationSetupScreen = () => {
  const navigation = useNavigation<CollectableNavigationProp>()
  const { t } = useTranslation()
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule>()
  const backEdges = ['top'] as Edge[]
  const [duration, setDuration] = useState('10')

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

  const handleSave = useCallback(() => {
    // TODO: Implement the actual automation setup
    // For now, just go back
    navigation.goBack()
  }, [navigation])

  const ScheduleOption = ({ schedule }: { schedule: Schedule }) => (
    <TouchableOpacityBox
      onPress={() => handleScheduleSelect(schedule)}
      backgroundColor={
        selectedSchedule === schedule ? 'white' : 'surfaceSecondary'
      }
      borderRadius="round"
      padding="m"
      marginBottom="m"
      alignItems="center"
      justifyContent="center"
    >
      <Text
        variant="body1Medium"
        color={selectedSchedule === schedule ? 'black' : 'white'}
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

          <ScheduleOption schedule="daily" />
          <ScheduleOption schedule="weekly" />
          <ScheduleOption schedule="monthly" />

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

          <ButtonPressable
            title={t('generic.save')}
            backgroundColor="hntBlue"
            backgroundColorOpacityPressed={0.7}
            titleColor="white"
            disabled={!selectedSchedule || !duration}
            onPress={handleSave}
            borderRadius="round"
            padding="m"
            marginBottom="m"
          />
        </Box>
      </ScrollView>
    </BackScreen>
  )
}

export default AutomationSetupScreen
