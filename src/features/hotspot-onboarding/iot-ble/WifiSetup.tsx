import BackScreen from '@components/BackScreen'
import Box from '@components/Box'
import ButtonPressable from '@components/ButtonPressable'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { BleError, useHotspotBle } from '@helium/react-native-sdk'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HotspotBLEStackParamList, HotspotBleNavProp } from './navTypes'

type Route = RouteProp<HotspotBLEStackParamList, 'WifiSetup'>
const WifiSetup = () => {
  const {
    params: { network },
  } = useRoute<Route>()
  const [secureTextEntry, setSecureTextEntry] = useState(true)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [password, setPassword] = useState('')
  const { setWifi } = useHotspotBle()
  const { t } = useTranslation()
  const navigation = useNavigation<HotspotBleNavProp>()
  const onBack = useCallback(() => {
    navigation.navigate('WifiSettings', {
      network,
    })
  }, [network, navigation])

  const toggleSecureEntry = useCallback(() => {
    setSecureTextEntry(!secureTextEntry)
  }, [secureTextEntry])

  const handleSetWifi = useCallback(async () => {
    setLoading(true)
    try {
      const nextStatus = await setWifi(network, password)
      setStatus(nextStatus)
      onBack()
    } catch (e) {
      if (typeof e === 'string') {
        setStatus(e)
      } else {
        setStatus((e as BleError).toString())
      }
    }
    setLoading(false)
  }, [onBack, network, password, setWifi])

  return (
    <BackScreen title={`Setup ${network}`}>
      <Box flexDirection="row">
        <TextInput
          flexGrow={1}
          textInputProps={{
            placeholder: t('generic.password'),
            autoCorrect: false,
            secureTextEntry,
            autoComplete: 'off',
            onChangeText: setPassword,
            value: password,
            autoFocus: true,
            keyboardAppearance: 'dark',
          }}
        />
        <ButtonPressable
          title={secureTextEntry ? 'Show' : 'Hide'}
          onPress={toggleSecureEntry}
        />
      </Box>

      <ButtonPressable
        mt="l"
        borderRadius="round"
        titleColor="white"
        borderColor="white"
        borderWidth={1}
        backgroundColor="transparent"
        onPress={handleSetWifi}
        disabled={loading}
        title={t('hotspotOnboarding.wifiSettings.setup')}
      />
      <Text>{loading ? 'loading...' : status}</Text>
    </BackScreen>
  )
}

export default WifiSetup
