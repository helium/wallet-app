import React, { memo, useEffect, useMemo } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import HomeNavigator from '../features/home/HomeNavigator'
import { useColors } from '../theme/themeHooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import TabBarNavigator from './TabBarNavigator'
import { useAppStorage } from '../storage/AppStorageProvider'

const RootNavigator = () => {
  const colors = useColors()
  const { hasAccounts } = useAccountStorage()
  const { l1Network } = useAppStorage()

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  const hasAccountsNavigator = useMemo(() => {
    return l1Network === 'helium' ? <HomeNavigator /> : <TabBarNavigator />
  }, [l1Network])

  return hasAccounts ? hasAccountsNavigator : <OnboardingNavigator />
}

export default memo(RootNavigator)
