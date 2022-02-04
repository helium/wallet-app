import React, { memo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useOpacity } from '../../theme/themeHooks'
import Settings from './Settings'
import SettingsConfirmPinScreen from './SettingsConfirmPinScreen'
import SettingsCreatePinScreen from './SettingsCreatePinScreen'
import RevealWordsScreen from './RevealWordsScreen'
import UpdateAliasScreen from './UpdateAliasScreen'

const SettingsStack = createNativeStackNavigator()

const SettingsNavigator = () => {
  const { backgroundStyle } = useOpacity('primaryBackground', 0.98)
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: backgroundStyle,
      }}
    >
      <SettingsStack.Screen name="Settings" component={Settings} />
      <SettingsStack.Screen
        name="SettingsConfirmPin"
        component={SettingsConfirmPinScreen}
        options={{ presentation: 'modal' }}
      />
      <SettingsStack.Screen
        name="SettingsCreatePin"
        component={SettingsCreatePinScreen}
        options={{ presentation: 'modal' }}
      />
      <SettingsStack.Screen name="RevealWords" component={RevealWordsScreen} />
      <SettingsStack.Screen name="UpdateAlias" component={UpdateAliasScreen} />
    </SettingsStack.Navigator>
  )
}

export default memo(SettingsNavigator)
