import React, { useMemo } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useBorderRadii, useColors } from '@theme/themeHooks'
import ServiceSheet from './ServiceSheet'
import WalletService from './WalletService'
import HotspotService from './HotspotService'
import AccountsService from './AccountsService'
import GovernanceService from './GovernanceService'
import BrowserService from './BrowserService'
import SettingsService from './SettingsService'
import NotificationsService from './NotificationsService'

const ServiceSheetStack = createNativeStackNavigator()

const ServiceSheetNavigator = () => {
  const colors = useColors()
  const borderRadii = useBorderRadii()

  const navigatorScreenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: 'none',
      contentStyle: {
        backgroundColor: colors['fg.white'],
        borderTopLeftRadius: borderRadii['4xl'] + borderRadii['4xl'],
        borderTopRightRadius: borderRadii['4xl'] + borderRadii['4xl'],
        overflow: 'hidden',
      },
    }),
    [borderRadii, colors],
  )

  return (
    <ServiceSheet>
      <ServiceSheetStack.Navigator
        screenOptions={navigatorScreenOptions as any}
      >
        <ServiceSheetStack.Screen
          name="WalletService"
          component={WalletService}
        />
        <ServiceSheetStack.Screen
          name="HotspotService"
          component={HotspotService}
        />
        <ServiceSheetStack.Screen
          name="AccountsService"
          component={AccountsService}
        />
        <ServiceSheetStack.Screen
          name="GovernanceService"
          component={GovernanceService}
        />
        <ServiceSheetStack.Screen
          name="BrowserService"
          component={BrowserService}
        />
        <ServiceSheetStack.Screen
          name="NotificationsService"
          component={NotificationsService}
        />
        <ServiceSheetStack.Screen
          name="SettingsService"
          component={SettingsService}
        />
      </ServiceSheetStack.Navigator>
    </ServiceSheet>
  )
}

export default ServiceSheetNavigator
