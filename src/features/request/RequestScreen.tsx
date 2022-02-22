import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { RouteProp, useRoute } from '@react-navigation/native'
import { Keyboard } from 'react-native'
import Text from '../../components/Text'
import { HomeStackParamList } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import SafeAreaBox, {
  useModalSafeAreaEdges,
} from '../../components/SafeAreaBox'
import TouchableWithoutFeedbackBox from '../../components/TouchableWithoutFeedbackBox'
import CopyAddress from '../../components/CopyAddress'

type Route = RouteProp<HomeStackParamList, 'RequestScreen'>
const RequestScreen = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const route = useRoute<Route>()
  const edges = useModalSafeAreaEdges()
  const { currentAccount } = useAccountStorage()
  const { t } = useTranslation()

  return (
    <TouchableWithoutFeedbackBox flex={1} onPress={Keyboard.dismiss}>
      <SafeAreaBox backgroundColor="primaryBackground" flex={1} edges={edges}>
        <Text variant="subtitle2" paddingTop="l" textAlign="center">
          {t('request.title')}
        </Text>
        {currentAccount?.address && (
          <CopyAddress address={currentAccount.address} />
        )}
      </SafeAreaBox>
    </TouchableWithoutFeedbackBox>
  )
}

export default memo(RequestScreen)
