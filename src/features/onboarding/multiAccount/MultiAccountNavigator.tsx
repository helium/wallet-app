import * as React from 'react'
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack'
import { useEffect } from 'react'
import { NetType } from '@helium/crypto-react-native'
import { useOnboarding } from '../OnboardingProvider'
import AccountImportStartScreen from '../import/AccountImportStartScreen'
import PairStart from '../../ledger/PairStart'
import MultiAccountImportStartScreen from './MultiAccountImportStartScreen'

const MultiAccountStack = createStackNavigator<MultiAccountStackParamList>()

type Props = { netType: NetType.NetType }
const MultiAccountNavigator = ({ netType }: Props) => {
  const { setOnboardingData } = useOnboarding()

  useEffect(() => {
    setOnboardingData((prev) => ({ ...prev, netType }))
  }, [netType, setOnboardingData])

  return (
    <MultiAccountStack.Navigator screenOptions={{ headerShown: false }}>
      <MultiAccountStack.Screen
        name="AccountImportStartScreen"
        component={AccountImportStartScreen}
      />
      <MultiAccountStack.Screen
        name="AccountCreateStart"
        component={MultiAccountImportStartScreen}
      />
      <MultiAccountStack.Screen name="LedgerStart" component={PairStart} />
    </MultiAccountStack.Navigator>
  )
}

export default MultiAccountNavigator

export type MultiAccountStackParamList = {
  AccountImportStartScreen: undefined
  AccountCreateStart: undefined
  LedgerStart: undefined
}

export type MultiAccountNavigationProp =
  StackNavigationProp<MultiAccountStackParamList>
