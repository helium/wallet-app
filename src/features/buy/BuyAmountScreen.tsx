import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useCallback, useEffect, useRef } from 'react'
import HNTKeyboard, { HNTKeyboardRef } from '../../components/HNTKeyboard'
import Box from '../../components/Box'
import { BuyNavigationProp, BuyStackParamList } from './buyTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

type Route = RouteProp<BuyStackParamList, 'BuyAmountScreen'>

const BuyAmountScreen = () => {
  const route = useRoute<Route>()
  const { currentAccount } = useAccountStorage()
  const navigation = useNavigation<BuyNavigationProp>()
  const hntKeyboardRef = useRef<HNTKeyboardRef>(null)

  const { token } = route.params

  const onClose = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return

    hntKeyboardRef.current?.show({
      payee: currentAccount?.solanaAddress,
    })
  }, [currentAccount])

  const onConfirmBalance = useCallback(() => {
    navigation.navigate('ChooseProviderScreen')
  }, [navigation])

  return (
    <HNTKeyboard
      onConfirmBalance={onConfirmBalance}
      ref={hntKeyboardRef}
      ticker={token}
      isStatic
      onCancel={onClose}
    >
      <Box />
    </HNTKeyboard>
  )
}

export default BuyAmountScreen
