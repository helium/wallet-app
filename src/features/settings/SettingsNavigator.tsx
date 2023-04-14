import React, { memo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useOpacity } from '@theme/themeHooks'
import Settings from './Settings'
import SettingsConfirmPinScreen from './SettingsConfirmPinScreen'
import SettingsCreatePinScreen from './SettingsCreatePinScreen'
import RevealWordsScreen from './RevealWordsScreen'
import UpdateAliasScreen from './UpdateAliasScreen'
import ShareAddressScreen from './ShareAddressScreen'
import ConfirmSignoutScreen from './ConfirmSignoutScreen'
import RevealPrivateKeyScreen from './RevealPrivateKeyScreen'
import SolanaMigration from '../migration/SolanaMigration'

const SettingsStack = createNativeStackNavigator()

const SolanaMigrationWrapper = () => {
  return <SolanaMigration hideBack={false} manual />
}

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
      <SettingsStack.Screen
        name="RevealPrivateKey"
        component={RevealPrivateKeyScreen}
      />
      <SettingsStack.Screen name="UpdateAlias" component={UpdateAliasScreen} />
      <SettingsStack.Screen
        name="ShareAddress"
        component={ShareAddressScreen}
      />
      <SettingsStack.Screen
        name="ConfirmSignout"
        component={ConfirmSignoutScreen}
      />
      <SettingsStack.Screen
        name="MigrateWallet"
        component={SolanaMigrationWrapper}
        options={{ presentation: 'transparentModal' }}
      />
    </SettingsStack.Navigator>
  )
}

export default memo(SettingsNavigator)
