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

const Diagnostics = () => {
  const navigation = useNavigation()
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
              mb="2"
              pb="2"
              borderColor="gray.900"
              borderBottomWidth={1}
            >
              <Text variant="textLgMedium" color="secondaryText">
                {key}
              </Text>
              <Text variant="textLgMedium" color="secondaryText">
                {JSON.stringify(value)}
              </Text>
            </Box>
          ))}
        {!diagnosticInfo && !loading && (
          <Text variant="textXlMedium" color="secondaryText">
            {t('hotspotOnboarding.diagnostics.noneFound')}
          </Text>
        )}
      </ScrollView>

      <ButtonPressable
        marginTop="6"
        borderRadius="full"
        titleColor="base.white"
        borderColor="base.white"
        borderWidth={2}
        backgroundColor="transparent"
        title={loading ? undefined : t('hotspotOnboarding.diagnostics.get')}
        onPress={handleSetDiagnostics}
        backgroundColorDisabled="bg.tertiary"
        backgroundColorDisabledOpacity={0.5}
        disabled={loading}
        LeadingComponent={loading ? <CircleLoader /> : undefined}
      />
      <ButtonPressable
        marginTop="6"
        borderRadius="full"
        titleColor="base.black"
        borderColor="transparent"
        backgroundColor="base.white"
        title={t('generic.done')}
        onPress={navNext}
      />
    </BackScreen>
  )
}

export default Diagnostics
