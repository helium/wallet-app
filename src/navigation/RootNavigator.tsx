import React, { memo, useEffect } from 'react'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { useColors } from '../theme/themeHooks'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import HomeNavigator from '../features/home/HomeNavigator'

const RootNavigator = () => {
  const colors = useColors()
  const { hasAccounts } = useAccountStorage()

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  return hasAccounts ? <HomeNavigator /> : <OnboardingNavigator />
}

export default memo(RootNavigator)
