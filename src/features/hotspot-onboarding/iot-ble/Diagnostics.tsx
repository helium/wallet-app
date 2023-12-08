import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import CircleLoader from '@components/CircleLoader'
import Text from '@components/Text'
import { DiagnosticInfo, useHotspotBle } from '@helium/react-native-sdk'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import type { HotspotBleNavProp } from './navTypes'

const Diagnostics = () => {
  const navigation = useNavigation<HotspotBleNavProp>()
  const navNext = useCallback(() => navigation.goBack(), [navigation])

  const { getDiagnosticInfo } = useHotspotBle()
  const [callNum, setCallNum] = useState(0)
  const { t } = useTranslation()
  const { loading, result: diagnosticInfo } = useAsync(
    async (
      getDiagnosticInfoFn: () => Promise<DiagnosticInfo>,
      _callIdx: number,
    ) => {
      return getDiagnosticInfoFn()
    },
    [getDiagnosticInfo, callNum],
  )

  const handleSetDiagnostics = useCallback(() => {
    setCallNum((n) => n + 1)
  }, [setCallNum])

  return (
    <BackScreen title={t('hotspotOnboarding.diagnostics.title')}>
      <ScrollView>
        {diagnosticInfo &&
          Object.entries(diagnosticInfo).map(([key, value]) => (
            <Box
              key={key}
              flexDirection="row"
              justifyContent="space-between"
              mb="s"
              pb="s"
              borderColor="grey900"
              borderBottomWidth={1}
            >
              <Text variant="subtitle2" color="secondaryText">
                {key}
              </Text>
              <Text variant="subtitle2" color="secondaryText">
                {JSON.stringify(value)}
              </Text>
            </Box>
          ))}
        {!diagnosticInfo && !loading && (
          <Text variant="subtitle1" color="secondaryText">
            {t('hotspotOnboarding.diagnostics.noneFound')}
          </Text>
        )}
      </ScrollView>

      <ButtonPressable
        marginTop="l"
        borderRadius="round"
        titleColor="white"
        borderColor="white"
        borderWidth={2}
        backgroundColor="transparent"
        title={loading ? undefined : t('hotspotOnboarding.diagnostics.get')}
        onPress={handleSetDiagnostics}
        backgroundColorDisabled="surfaceSecondary"
        backgroundColorDisabledOpacity={0.5}
        disabled={loading}
        LeadingComponent={loading ? <CircleLoader /> : undefined}
      />
      <ButtonPressable
        marginTop="l"
        borderRadius="round"
        titleColor="black"
        borderColor="transparent"
        backgroundColor="white"
        title={t('generic.done')}
        onPress={navNext}
      />
    </BackScreen>
  )
}

export default Diagnostics
