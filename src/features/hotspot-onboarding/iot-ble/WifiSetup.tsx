import { BleError, useHotspotBle } from '@helium/react-native-sdk'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { Input } from '@ui/Input'
import { Text } from '@ui/Text'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import OnboardingScreen from '../components/OnboardingScreen'
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
  const onBack = () => {
    navigation.navigate(
      'WifiSettings',
      {
        network,
      },
      { pop: true },
    )
  }

  const toggleSecureEntry = () => {
    setSecureTextEntry((prev) => !prev)
  }

  const handleSetWifi = async () => {
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
  }

  return (
    <OnboardingScreen title={`Setup ${network}`}>
      <View className="flex-row items-center gap-2">
        <Input
          variant="form"
          className="flex-1"
          placeholder={t('generic.password')}
          autoCorrect={false}
          secureTextEntry={secureTextEntry}
          autoComplete="off"
          onChangeText={setPassword}
          value={password}
          autoFocus
        />
        <Button variant="ghost" size="lg" onPress={toggleSecureEntry}>
          {secureTextEntry ? 'Show' : 'Hide'}
        </Button>
      </View>

      <Button
        variant="outline"
        size="lg"
        className="mt-6 w-full"
        onPress={() => void handleSetWifi().catch(console.error)}
        disabled={loading}
      >
        {t('hotspotOnboarding.wifiSettings.setup')}
      </Button>
      <Text>{loading ? 'loading...' : status}</Text>
    </OnboardingScreen>
  )
}

export default WifiSetup
