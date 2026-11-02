import React, { useState } from 'react'
import useSubmitTxn from '@hooks/useSubmitTxn'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Button } from '@ui/Button'
import { Card } from '@ui/Card'
import { Input } from '@ui/Input'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { useTranslation } from 'react-i18next'
import {
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import Animated from 'react-native-reanimated'
import { useEntityKey } from '@hooks/useEntityKey'
import { useIotInfo } from '@hooks/useIotInfo'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import BackHeader from './components/BackHeader'
import {
  CollectableNavigationProp,
  CollectableStackParamList,
} from './collectablesTypes'
import { parseH3BNLocation } from '../../utils/h3'
import * as Logger from '../../utils/logger'

const SafeArea = withUniwind(TabSafeAreaView)

type Route = RouteProp<CollectableStackParamList, 'AntennaSetupScreen'>
const AntennaSetupScreen = () => {
  const { t } = useTranslation()
  const nav = useNavigation<CollectableNavigationProp>()
  const route = useRoute<Route>()
  const { collectable } = route.params
  const entityKey = useEntityKey(collectable)
  const iotInfoAcc = useIotInfo(entityKey)
  const [hasSetDefaults, setHasSetDefaults] = useState(false)
  const [gain, setGain] = useState<string>()
  const [elevation, setElevation] = useState<string>()
  const [updating, setUpdating] = useState(false)
  const [transactionError, setTransactionError] = useState<string>()
  const { submitUpdateEntityInfo } = useSubmitTxn()

  const iotLocation = iotInfoAcc?.info?.location
    ? parseH3BNLocation(iotInfoAcc.info.location).reverse()
    : undefined

  if (!hasSetDefaults && iotInfoAcc?.info) {
    if (iotInfoAcc?.info?.gain) {
      setGain(`${iotInfoAcc?.info?.gain / 10}`)
    }

    if (iotInfoAcc?.info?.elevation) {
      setElevation(`${iotInfoAcc?.info?.elevation}`)
    }

    setHasSetDefaults(true)
  }

  const handleUpdateElevGain = async () => {
    if (iotLocation && entityKey) {
      setTransactionError(undefined)
      setUpdating(true)
      try {
        const batchId = await submitUpdateEntityInfo({
          type: 'IOT',
          entityKey,
          lng: iotLocation[0],
          lat: iotLocation[1],
          elevation,
          decimalGain: gain,
        })
        nav.push('SettingUpAntennaScreen', { batchId })
      } catch (error) {
        setUpdating(false)
        Logger.error(error)
        setTransactionError((error as Error).message)
      }
    }
  }

  return (
    <Animated.View className="flex-1">
      <SafeArea className="flex-1" edges={['top']}>
        <BackHeader title={t('antennaSetupScreen.title')} className="mt-6" />
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <KeyboardAvoidingView className="flex-1" behavior="padding">
            <SafeArea
              edges={['bottom']}
              className="mx-2 my-1 flex-1 bg-transparent p-4"
            >
              <View className="grow justify-center">
                <Text
                  size="lg"
                  className="text-left font-medium"
                  adjustsFontSizeToFit
                >
                  {t('antennaSetupScreen.antennaSetup')}
                </Text>
                <Text className="mb-4 font-medium text-muted-foreground">
                  {t('antennaSetupScreen.antennaSetupDescription')}
                </Text>
                <Card variant="panel" className="w-full gap-3">
                  <View className="gap-1">
                    <Text size="xs" className="text-muted-foreground">
                      {t('antennaSetupScreen.gainPlaceholder')}
                    </Text>
                    <Input
                      variant="form"
                      placeholder={t('antennaSetupScreen.gainPlaceholder')}
                      onChangeText={setGain}
                      value={gain}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View className="gap-1">
                    <Text size="xs" className="text-muted-foreground">
                      {t('antennaSetupScreen.elevationPlaceholder')}
                    </Text>
                    <Input
                      variant="form"
                      placeholder={t('antennaSetupScreen.elevationPlaceholder')}
                      onChangeText={setElevation}
                      value={elevation}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </Card>
              </View>
              <View className="my-2 min-h-10 flex-row items-center justify-center">
                {transactionError && (
                  <Text size="xs" className="font-medium text-destructive">
                    {transactionError}
                  </Text>
                )}
              </View>
              <Button
                variant="cta"
                size="dashboard"
                className="w-full"
                disabled={updating}
                onPress={() => void handleUpdateElevGain().catch(console.error)}
              >
                {updating ? (
                  <Spinner colorClassName="accent-white" />
                ) : (
                  t('antennaSetupScreen.submit')
                )}
              </Button>
            </SafeArea>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeArea>
    </Animated.View>
  )
}

export default AntennaSetupScreen
