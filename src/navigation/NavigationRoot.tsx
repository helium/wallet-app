import React, { memo, useEffect, useMemo } from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import changeNavigationBarColor from 'react-native-navigation-bar-color'
import { Button } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AnimatePresence } from 'moti'
import { useColors } from '../theme/themeHooks'
import OnboardingNavigator from '../features/onboarding/OnboardingNavigator'
import { useAccountStorage } from '../storage/AccountStorageProvider'
import Text from '../components/Text'
import MotiBox from '../components/MotiBox'
import SafeAreaBox from '../components/SafeAreaBox'

const OnboardingStack = createStackNavigator()

const NavigationRoot = () => {
  const colors = useColors()
  const { accounts, signOut } = useAccountStorage()
  const { t } = useTranslation()

  useEffect(() => {
    changeNavigationBarColor(colors.primaryBackground, true, false)
  }, [colors.primaryBackground])

  const hasAccounts = useMemo(
    () => !!Object.keys(accounts || {}).length,
    [accounts],
  )

  return (
    <>
      {hasAccounts && (
        <SafeAreaBox padding="xl" backgroundColor="primaryBackground" flex={1}>
          <Button title={t('auth.signOut')} onPress={signOut} />
          <Text variant="body1">{JSON.stringify(accounts, null, 2)}</Text>
        </SafeAreaBox>
      )}
      <AnimatePresence>
        {!hasAccounts && (
          <MotiBox
            backgroundColor="primaryBackground"
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            from={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
          >
            <OnboardingStack.Navigator screenOptions={{ headerShown: false }}>
              <OnboardingStack.Screen
                name="OnboardingNavigator"
                component={OnboardingNavigator}
              />
            </OnboardingStack.Navigator>
          </MotiBox>
        )}
      </AnimatePresence>
    </>
  )
}

export default memo(NavigationRoot)
