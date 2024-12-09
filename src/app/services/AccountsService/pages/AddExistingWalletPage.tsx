import Box from '@components/Box'
import ScrollBox from '@components/ScrollBox'
import { NavBarHeight } from '@components/ServiceNavBar'
import { useSpacing, useColors } from '@config/theme/themeHooks'
import Text from '@components/Text'
import React, { useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleProp, ViewStyle } from 'react-native'
import SecretPhrase from '@assets/svgs/secretPhrase.svg'
import PrivateKey from '@assets/svgs/privateKey.svg'
import CarotRight from '@assets/svgs/carot-right.svg'
import CommandLine from '@assets/svgs/commandLine.svg'
import TouchableContainer from '@components/TouchableContainer'
import {
  createStackNavigator,
  StackNavigationOptions,
  StackNavigationProp,
} from '@react-navigation/stack'
import { useTheme } from '@shopify/restyle'
import ImportAccountNavigator from '@features/onboarding/import/ImportAccountNavigator'
import {
  OnboardingSheetRef,
  FlowType,
  OnboardingSheetWrapper,
} from '@features/onboarding/OnboardingSheet'

const AddExistingWalletPage = () => {
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const { bottom } = useSafeAreaInsets()
  const onboardingSheetRef = useRef<OnboardingSheetRef>(null)

  const onAddExistingWallet = useCallback(
    (flowType: FlowType) => () => {
      onboardingSheetRef.current?.show(flowType)
    },
    [onboardingSheetRef],
  )

  const contentContainerStyle = useMemo(
    () => ({
      paddingHorizontal: spacing['2xl'],
      flex: 1,
      justifyContent: 'center',
      gap: spacing.xl,
      paddingBottom: bottom + spacing['2xl'] + NavBarHeight,
    }),
    [spacing, bottom],
  )

  return (
    <ScrollBox
      contentContainerStyle={contentContainerStyle as StyleProp<ViewStyle>}
    >
      <Text variant="displayMdSemibold" color="primaryText" textAlign="center">
        {t('AddExistingWalletPage.title')}
      </Text>
      <Text
        variant="textXlRegular"
        color="text.quaternary-500"
        textAlign="center"
        paddingHorizontal="4xl"
      >
        {t('AddExistingWalletPage.subtitle')}
      </Text>
      <Box
        backgroundColor="cardBackground"
        borderRadius="2xl"
        flexDirection="column"
        overflow="hidden"
      >
        <TouchableContainer
          flexDirection="row"
          gap="2.5"
          alignItems="center"
          borderBottomWidth={2}
          borderColor="primaryBackground"
          padding="xl"
          paddingEnd="3xl"
          onPress={onAddExistingWallet('secret-phrase')}
        >
          <SecretPhrase />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {t('AddExistingWalletPage.secretPhrase')}
            </Text>
            <Text variant="textSmRegular" color="text.quaternary-500">
              {t('AddExistingWalletPage.twelveOrTwentyFourWords')}
            </Text>
          </Box>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
        <TouchableContainer
          flexDirection="row"
          gap="2.5"
          alignItems="center"
          padding="xl"
          borderBottomWidth={2}
          borderColor="primaryBackground"
          paddingEnd="3xl"
          onPress={onAddExistingWallet('private-key')}
        >
          <PrivateKey />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {t('AddExistingWalletPage.privateKey')}
            </Text>
            <Text variant="textSmRegular" color="text.quaternary-500">
              {t('AddExistingWalletPage.aStringOfCharacters')}
            </Text>
          </Box>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
        <TouchableContainer
          flexDirection="row"
          gap="2.5"
          alignItems="center"
          padding="xl"
          paddingEnd="3xl"
          onPress={onAddExistingWallet('command-line')}
        >
          <CommandLine />
          <Box flex={1}>
            <Text variant="textLgSemibold" color="primaryText">
              {t('AddExistingWalletPage.commandLine')}
            </Text>
            <Text variant="textSmRegular" color="text.quaternary-500">
              {t('AddExistingWalletPage.scanCli')}
            </Text>
          </Box>
          <CarotRight color={colors['text.quaternary-500']} />
        </TouchableContainer>
      </Box>
      <OnboardingSheetWrapper ref={onboardingSheetRef} />
    </ScrollBox>
  )
}

export type AddExistingWalletStackParamList = {
  AddExistingWalletPage: undefined
  ImportAccount:
    | undefined
    | {
        screen: 'AccountImportScreen'
        params: {
          restoringAccount?: boolean
          accountAddress?: string
        }
      }
}

export type AddExistingWalletNavigationProp =
  StackNavigationProp<AddExistingWalletStackParamList>

const AddExistingWalletStack =
  createStackNavigator<AddExistingWalletStackParamList>()

const AddExistingWalletNavigator = () => {
  const { colors } = useTheme()
  const screenOptions = useMemo(
    () =>
      ({
        headerShown: false,
        cardStyle: {
          backgroundColor: colors.primaryBackground,
        },
      } as StackNavigationOptions),
    [colors],
  )
  return (
    <AddExistingWalletStack.Navigator screenOptions={screenOptions}>
      <AddExistingWalletStack.Screen
        name="AddExistingWalletPage"
        component={AddExistingWalletPage}
      />
      <AddExistingWalletStack.Screen
        name="ImportAccount"
        component={ImportAccountNavigator}
      />
    </AddExistingWalletStack.Navigator>
  )
}

export default AddExistingWalletNavigator
