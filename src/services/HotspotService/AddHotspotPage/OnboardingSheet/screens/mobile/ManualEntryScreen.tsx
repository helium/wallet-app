import React, { useCallback, useMemo, useState } from 'react'
import Text from '@components/Text'
import Box from '@components/Box'
import { useTranslation } from 'react-i18next'
import TextInputNew from '@components/TextInputNew'
import CheckButton from '../../components/CheckButton'
import { useHotspotOnboarding } from '../../index'
import Loading from '../../components/Loading'

const ManualEntryScreen = () => {
  const { t } = useTranslation()
  const [validNetworkName, setValidNetworkName] = useState(false)
  const [validNetworkPassword, setValidNetworkPassword] = useState(false)
  const [ssid, setSsid] = useState('')
  const [password, setPassword] = useState('')

  const {
    carouselRef,
    getDeviceInfo,
    getDeviceInfoError,
    getDeviceInfoLoading,
  } = useHotspotOnboarding()

  const onChangeNetworkName = useCallback((text: string) => {
    // Regex to validate network name looks like Helium-XXXX
    setValidNetworkName(text.length > 8 && text.includes('Helium-'))
    setSsid(text)
  }, [])

  const onChangeNetworkPassword = useCallback((text: string) => {
    setValidNetworkPassword(text.length > 7)
    setPassword(text)
  }, [])

  const wifiDataB64 = useMemo(() => {
    if (!validNetworkName || !validNetworkPassword) return

    const wifiData = `WIFI:S:${ssid};T:WPA;P:${password};H:false;`
    return Buffer.from(wifiData).toString('base64')
  }, [password, ssid, validNetworkName, validNetworkPassword])

  const onNext = useCallback(async () => {
    if (!wifiDataB64) {
      // TODO: Show generic error
      return
    }
    const deviceInfo = await getDeviceInfo(wifiDataB64)

    if (deviceInfo) {
      carouselRef?.current?.snapToNext()
    }
  }, [carouselRef, getDeviceInfo, wifiDataB64])

  return (
    <Box justifyContent="center" alignItems="center" flex={1} padding="2xl">
      <Text variant="displayMdSemibold" color="primaryText" marginBottom="2.5">
        {t('ManualEntryScreen.title')}
      </Text>
      <Text
        variant="textLgRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('ManualEntryScreen.subtitle')}
      </Text>
      <Box flexDirection="row" marginTop="2xl">
        <Box flexDirection="column" gap="0.5" flex={1}>
          <TextInputNew
            label="Enter Network Name"
            textInputProps={{
              placeholder: 'Helium-XXXX',
              onChangeText: onChangeNetworkName,
            }}
            borderBottomStartRadius="none"
            borderBottomEndRadius="none"
          />
          <TextInputNew
            label="Enter Network Password"
            textInputProps={{
              placeholder: '1234aBcD',
              onChangeText: onChangeNetworkPassword,
            }}
            borderTopStartRadius="none"
            borderTopEndRadius="none"
          />
        </Box>
      </Box>
      {getDeviceInfoError && (
        <Text
          variant="textLgMedium"
          color="error.500"
          marginTop="xl"
          textAlign="center"
          paddingHorizontal="2xl"
        >
          {t('ManualEntryScreen.tryAgain')}
        </Text>
      )}
      {validNetworkName && validNetworkPassword && !getDeviceInfoLoading && (
        <CheckButton onPress={onNext} />
      )}
      {getDeviceInfoLoading && <Loading />}
    </Box>
  )
}

export default ManualEntryScreen
