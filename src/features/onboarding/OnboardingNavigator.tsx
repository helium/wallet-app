import * as React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { memo, useCallback, useMemo } from 'react'
import { StyleProp, ViewStyle } from 'react-native'
import AccountCreatePassphraseScreen from './AccountCreatePassphraseScreen'
import { OnboardingStackParamList } from './onboardingTypes'
import AccountEnterPassphraseScreen from './AccountEnterPassphraseScreen'
import AccountAssignScreen from './AccountAssignScreen'
import AccountCreatePinScreen from './AccountCreatePinScreen'
import AccountConfirmPinScreen from './AccountConfirmPinScreen'
import AccountImportCompleteScreen from './AccountImportCompleteScreen'
import AccountImportScreen from './AccountImportScreen'
import ImportAccountConfirmScreen from './ImportAccountConfirmScreen'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useColors } from '../../theme/themeHooks'
import { OnboardingOpt, useOnboarding } from './OnboardingProvider'
import OnboardingSegment from './OnboardingSegment'

const OnboardingStack = createStackNavigator<OnboardingStackParamList>()

const OnboardingNavigator = () => {
  const { primaryBackground } = useColors()
  const {
    onboardingData: { onboardingType },
    setOnboardingData,
  } = useOnboarding()

  const cardStyle = useMemo((): StyleProp<ViewStyle> => {
    return { backgroundColor: primaryBackground }
  }, [primaryBackground])

  const handleOnboardingChange = useCallback(
    (id: OnboardingOpt) => {
      setOnboardingData((prev) => ({ ...prev, onboardingType: id }))
    },
    [setOnboardingData],
  )

  return (
    <SafeAreaBox flex={1} backgroundColor="primaryBackground">
      {onboardingType !== 'assign' && (
        <OnboardingSegment
          onSegmentChange={handleOnboardingChange}
          onboardingType={onboardingType}
          paddingTop="l"
          paddingHorizontal="l"
        />
      )}
      <OnboardingStack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle,
        }}
      >
        {onboardingType === 'create' && (
          <OnboardingStack.Group>
            <OnboardingStack.Screen
              name="AccountCreatePassphraseScreen"
              component={AccountCreatePassphraseScreen}
            />
            <OnboardingStack.Screen
              name="AccountEnterPassphraseScreen"
              component={AccountEnterPassphraseScreen}
            />
          </OnboardingStack.Group>
        )}

        {onboardingType === 'import' && (
          <OnboardingStack.Group
            screenOptions={{ animationTypeForReplace: 'pop' }}
          >
            <OnboardingStack.Screen
              name="AccountImportScreen"
              component={AccountImportScreen}
            />
            <OnboardingStack.Screen
              name="ImportAccountConfirmScreen"
              component={ImportAccountConfirmScreen}
            />
            <OnboardingStack.Screen
              name="AccountImportCompleteScreen"
              component={AccountImportCompleteScreen}
            />
          </OnboardingStack.Group>
        )}
        <OnboardingStack.Screen
          name="AccountAssignScreen"
          component={AccountAssignScreen}
        />
        <OnboardingStack.Screen
          name="AccountCreatePinScreen"
          component={AccountCreatePinScreen}
        />
        <OnboardingStack.Screen
          name="AccountConfirmPinScreen"
          component={AccountConfirmPinScreen}
        />
      </OnboardingStack.Navigator>
    </SafeAreaBox>
  )
}

export default memo(OnboardingNavigator)
