import { createNativeStackNavigator } from '@react-navigation/native-stack'
import ServiceSheet from './ServiceSheet'
import WalletService from './WalletService'
import HotspotService from './HotspotService'
import AccountsService from './AccountsService'
import GovernanceService from './GovernanceService'
import BrowserService from './BrowserService'
import { useMemo } from 'react'
import { useColors, useSpacing } from '@theme/themeHooks'
import SettingsService from './SettingsService'

const ServiceSheetStack = createNativeStackNavigator()

const ServiceSheetNavigator = () => {
  const spacing = useSpacing()
  const colors = useColors()

  const navigatorScreenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: 'none',
      contentStyle: {
        backgroundColor: colors['fg.white'],
        borderTopLeftRadius: spacing[15],
        borderTopRightRadius: spacing[15],
        overflow: 'hidden',
      },
    }),
    [spacing],
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
          name="SettingsService"
          component={SettingsService}
        />
      </ServiceSheetStack.Navigator>
    </ServiceSheet>
  )
}

export default ServiceSheetNavigator
