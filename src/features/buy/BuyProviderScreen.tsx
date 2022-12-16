import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ModalScreen from '../../components/ModalScreen'
import { BuyNavigationProp, BuyStackParamList } from './buyTypes'
import Box from '../../components/Box'

type Route = RouteProp<BuyStackParamList, 'BuyProviderScreen'>

const BuyProviderScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<BuyNavigationProp>()
  const { t } = useTranslation()

  const onClose = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  return (
    <ModalScreen onClose={onClose} title={t('buyScreen.chooseProvider')}>
      <Box />
    </ModalScreen>
  )
}

export default BuyProviderScreen
