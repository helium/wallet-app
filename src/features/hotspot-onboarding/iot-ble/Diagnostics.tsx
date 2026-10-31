import { DiagnosticInfo, useHotspotBle } from '@helium/react-native-sdk'
import { useNavigation } from '@react-navigation/native'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@ui/Button'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import OnboardingScreen from '../components/OnboardingScreen'
import type { HotspotBleNavProp } from './navTypes'

const Diagnostics = () => {
  const navigation = useNavigation<HotspotBleNavProp>()
  const navNext = () => navigation.goBack()

  const { getDiagnosticInfo } = useHotspotBle()
  const [callNum, setCallNum] = useState(0)
  const { t } = useTranslation()
  const { isLoading: loading, data: diagnosticInfo } = useQuery({
    queryKey: ['hotspotDiagnostics', callNum],
    queryFn: (): Promise<DiagnosticInfo> => getDiagnosticInfo(),
    // A device read: never retry, and drop it on unmount so the next hotspot
    // does not see this one's result
    retry: false,
    gcTime: 0,
  })

  const handleSetDiagnostics = () => {
    setCallNum((n) => n + 1)
  }

  return (
    <OnboardingScreen title={t('hotspotOnboarding.diagnostics.title')}>
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        {diagnosticInfo &&
          Object.entries(diagnosticInfo).map(([key, value]) => (
            <View
              key={key}
              className="mb-2 flex-row justify-between border-b border-border pb-2"
            >
              <Text size="lg" className="font-medium text-muted-foreground">
                {key}
              </Text>
              <Text size="lg" className="font-medium text-muted-foreground">
                {JSON.stringify(value)}
              </Text>
            </View>
          ))}
        {!diagnosticInfo && !loading && (
          <Text size="xl" className="font-medium text-muted-foreground">
            {t('hotspotOnboarding.diagnostics.noneFound')}
          </Text>
        )}
      </ScrollView>

      <Button
        variant="outline"
        size="lg"
        className="mt-6 w-full"
        onPress={handleSetDiagnostics}
        disabled={loading}
      >
        {loading ? <Spinner /> : t('hotspotOnboarding.diagnostics.get')}
      </Button>
      <Button variant="cta" size="lg" className="mt-6 w-full" onPress={navNext}>
        {t('generic.done')}
      </Button>
    </OnboardingScreen>
  )
}

export default Diagnostics
