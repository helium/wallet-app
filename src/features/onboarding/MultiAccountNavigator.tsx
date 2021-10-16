import * as React from 'react'
import { createStackNavigator } from '@react-navigation/stack'
import { useEffect } from 'react'
import AccountCreatePassphraseScreen from './AccountCreatePassphraseScreen'
import { OnboardingStackParamList } from './onboardingTypes'
import AccountEnterPassphraseScreen from './AccountEnterPassphraseScreen'
import AccountImportCompleteScreen from './AccountImportCompleteScreen'
import AccountImportScreen from './AccountImportScreen'
import ImportAccountConfirmScreen from './ImportAccountConfirmScreen'
import { OnboardingOpt, useOnboarding } from './OnboardingProvider'

const MultiAccountStack = createStackNavigator<OnboardingStackParamList>()

type Props = { onboardingType: OnboardingOpt }
const MultiAccountNavigator = ({ onboardingType }: Props) => {
  const { setOnboardingData } = useOnboarding()

  useEffect(() => {
    setOnboardingData((prev) => ({ ...prev, onboardingType }))
  }, [onboardingType, setOnboardingData])

  return (
    <MultiAccountStack.Navigator screenOptions={{ headerShown: false }}>
      {onboardingType === 'create' && (
        <MultiAccountStack.Group>
          <MultiAccountStack.Screen
            name="AccountCreatePassphraseScreen"
            component={AccountCreatePassphraseScreen}
          />
          <MultiAccountStack.Screen
            name="AccountEnterPassphraseScreen"
            component={AccountEnterPassphraseScreen}
          />
        </MultiAccountStack.Group>
      )}

      {onboardingType === 'import' && (
        <MultiAccountStack.Group
          screenOptions={{ animationTypeForReplace: 'pop' }}
        >
          <MultiAccountStack.Screen
            name="AccountImportScreen"
            component={AccountImportScreen}
          />
          <MultiAccountStack.Screen
            name="ImportAccountConfirmScreen"
            component={ImportAccountConfirmScreen}
          />
          <MultiAccountStack.Screen
            name="AccountImportCompleteScreen"
            component={AccountImportCompleteScreen}
          />
        </MultiAccountStack.Group>
      )}
    </MultiAccountStack.Navigator>
  )
}

export default MultiAccountNavigator
