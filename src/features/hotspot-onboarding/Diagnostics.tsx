import BackButton from '@components/BackButton'
import ButtonPressable from '@components/ButtonPressable'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import { DiagnosticInfo, useHotspotBle } from '@helium/react-native-sdk'
import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HotspotBleNavProp } from './navTypes'

const Diagnostics = () => {
  const navigation = useNavigation<HotspotBleNavProp>()
  const [diagnosticInfo, setDiagnosticInfo] = useState<DiagnosticInfo>()
  const { getDiagnosticInfo } = useHotspotBle()
  const { t } = useTranslation()
  const onBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }, [navigation])
  const navNext = useCallback(
    () => navigation.push('AddGatewayBle'),
    [navigation],
  )

  useEffect(() => {
    getDiagnosticInfo()
      .then(setDiagnosticInfo)
      .catch(() => navNext())
  }, [getDiagnosticInfo, navNext])

  return (
    <SafeAreaBox paddingHorizontal="l" flex={1}>
      <BackButton onPress={onBack} paddingHorizontal="none" />
      <Text variant="h1">{t('hotspotOnboarding.diagnostics.title')}</Text>
      {diagnosticInfo && (
        <Text variant="body2" color="secondaryText">
          {JSON.stringify(diagnosticInfo, null, 2)}
        </Text>
      )}
      <ButtonPressable
        marginTop="l"
        borderRadius="round"
        titleColor="black"
        borderColor="transparent"
        backgroundColor="white"
        title={t('generic.next')}
        onPress={navNext}
      />
    </SafeAreaBox>
  )
}

export default Diagnostics
