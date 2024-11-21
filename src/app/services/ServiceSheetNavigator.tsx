import React, { useCallback, useMemo, useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useBorderRadii, useColors } from '@config/theme/themeHooks'
import { StackNavigationOptions } from '@react-navigation/stack'
import { useAppDispatch } from '@store/store'
import { appSlice } from '@store/slices/appSlice'
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
  const [currentService, setCurrentService] = useState('wallet')
  const dispatch = useAppDispatch()
  const navigatorScreenOptions = useMemo(
    () =>
      ({
        headerShown: false,
        animation: 'none',
        contentStyle: {
          backgroundColor: colors['fg.white'],
          borderTopLeftRadius: borderRadii['4xl'] + borderRadii['4xl'],
          borderTopRightRadius: borderRadii['4xl'] + borderRadii['4xl'],
          overflow: 'hidden',
        },
      } as StackNavigationOptions),
    [borderRadii, colors],
  )

  const onFocus = useCallback(
    (target: string | undefined) => {
      dispatch(appSlice.actions.setRootSheetPosition(undefined))
      switch (target?.split('-')[0]) {
        default:
        case 'WalletService':
          setCurrentService('wallet')
          break
        case 'HotspotService':
          setCurrentService('hotspots')
          break
        case 'AccountsService':
          setCurrentService('wallets')
          break
        case 'GovernanceService':
          setCurrentService('governance')
          break
        case 'BrowserService':
          setCurrentService('browser')
          break
        case 'NotificationsService':
          setCurrentService('notifications')
          break
        case 'SettingsService':
          setCurrentService('settings')
          break
      }
    },
    [dispatch],
  )

  return (
    <ServiceSheet currentService={currentService}>
      <ServiceSheetStack.Navigator
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        screenOptions={navigatorScreenOptions as any}
        screenListeners={{
          focus: ({ target }) => {
            onFocus(target)
          },
        }}
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
