import * as React from 'react'
import {
  createStackNavigator,
  StackNavigationProp,
} from '@react-navigation/stack'
import { useEffect } from 'react'
import { NetTypes as NetType } from '@helium/address'
import { useOnboarding } from '../OnboardingProvider'
import AccountImportStartScreen from '../import/AccountImportStartScreen'
import PairStart from '../../ledger/PairStart'
import MultiAccountImportStartScreen from './MultiAccountImportStartScreen'
import NetTypeSegment from '../NetTypeSegment'

const MultiAccountStack = createStackNavigator<MultiAccountStackParamList>()

type Props = { netType: NetType.NetType }
const MultiAccountNavigator = ({ netType }: Props) => {
  const { setOnboardingData } = useOnboarding()

  useEffect(() => {
    setOnboardingData((prev) => ({ ...prev, netType }))
  }, [netType, setOnboardingData])

  return (
    <>
      <NetTypeSegment justifyContent="center" paddingVertical="m" />
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
    </>
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
