import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useOpacity } from '@theme/themeHooks'
import React, { memo } from 'react'
import SecretKeyWarningScreen from '@components/SecretKeyWarningScreen'
import SolanaMigration from '../migration/SolanaMigration'
import AutoGasManager from './AutoGasManager'
import ConfirmSignoutScreen from './ConfirmSignoutScreen'
import RevealPrivateKeyScreen from './RevealPrivateKeyScreen'
import RevealWordsScreen from './RevealWordsScreen'
import Settings from './Settings'
import SettingsConfirmPinScreen from './SettingsConfirmPinScreen'
import SettingsCreatePinScreen from './SettingsCreatePinScreen'
import ShareAddressScreen from './ShareAddressScreen'
import UpdateAliasScreen from './UpdateAliasScreen'

const SettingsStack = createNativeStackNavigator()

const SolanaMigrationWrapper = () => {
  return <SolanaMigration hideBack={false} manual />
}

const RevealWordsWrapper = () => {
  return (
    <SecretKeyWarningScreen>
      <RevealWordsScreen />
    </SecretKeyWarningScreen>
  )
}

const RevealPrivateKeyWrapper = () => {
  return (
    <SecretKeyWarningScreen>
      <RevealPrivateKeyScreen />
    </SecretKeyWarningScreen>
  )
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
      <SettingsStack.Screen
        name="RevealWords"
        component={RevealWordsWrapper}
        options={{ presentation: 'fullScreenModal' }}
      />
      <SettingsStack.Screen
        name="RevealPrivateKey"
        component={RevealPrivateKeyWrapper}
        options={{ presentation: 'fullScreenModal' }}
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
      <SettingsStack.Screen
        name="AutoGasManager"
        component={AutoGasManager}
        options={{ presentation: 'transparentModal' }}
      />
    </SettingsStack.Navigator>
  )
}

export default memo(SettingsNavigator)
