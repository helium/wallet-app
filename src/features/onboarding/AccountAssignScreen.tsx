import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import FabButton from '@components/FabButton'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import CheckBox from '@react-native-community/checkbox'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { storeSecureAccount, toSecureAccount } from '@storage/secureStorage'
import { useColors, useSpacing } from '@theme/themeHooks'
import React, { memo, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { HomeStackParamList } from '../home/homeTypes'
import { useOnboarding } from './OnboardingProvider'
import { CreateAccountNavigationProp } from './create/createAccountNavTypes'
import { ImportAccountNavigationProp } from './import/importAccountNavTypes'

type Route = RouteProp<HomeStackParamList, 'AccountAssignScreen'>

const AccountAssignScreen = () => {
  const route = useRoute<Route>()
  const onboardingNav = useNavigation<
    ImportAccountNavigationProp & CreateAccountNavigationProp
  >()
  const rootNav = useNavigation<RootNavigationProp>()

  const { t } = useTranslation()
  const [alias, setAlias] = useState('')
  const {
    reset,
    onboardingData: { paths, words },
  } = useOnboarding()
  const insets = useSafeAreaInsets()
  const spacing = useSpacing()
  const colors = useColors()
  const { upsertAccounts, hasAccounts, updateDefaultAccountAddress } =
    useAccountStorage()
  const [setAsDefault, toggleSetAsDefault] = useState(false)

  const handlePress = useCallback(async () => {
    if (hasAccounts) {
      try {
        await Promise.all(
          paths.map(async (p) => {
            await storeSecureAccount(
              toSecureAccount({
                keypair: p.keypair,
                words,
                derivationPath: p.derivationPath,
              }),
            )
          }),
        )
        const newAccounts = paths.map((p, index) => ({
          alias: index === 0 ? alias : `${alias} ${index + 1}`,
          address: heliumAddressFromSolAddress(p.keypair.publicKey.toBase58()),
          solanaAddress: p.keypair.publicKey.toBase58(),
          derivationPath: p.derivationPath,
        }))
        await Promise.all(
          paths.map(async (p) => {
            await storeSecureAccount(
              toSecureAccount({
                words,
                keypair: p.keypair,
                derivationPath: p.derivationPath,
              }),
            )
          }),
        )
        await upsertAccounts(newAccounts)
        if (setAsDefault) {
          await updateDefaultAccountAddress(newAccounts[0].address)
        }

        rootNav.reset({
          index: 0,
          routes: [{ name: 'TabBarNavigator' }],
        })
        reset()
        return
      } catch (e) {
        console.error(e)
        return
      }
    }

    onboardingNav.navigate('AccountCreatePinScreen', {
      pinReset: false,
      ...route.params,
    })
  }, [
    hasAccounts,
    onboardingNav,
    route.params,
    paths,
    upsertAccounts,
    setAsDefault,
    rootNav,
    reset,
    words,
    alias,
    updateDefaultAccountAddress,
  ])

  const onCheckboxToggled = useCallback(
    (newValue) => toggleSetAsDefault(newValue),
    [],
  )

  return (
    <SafeAreaBox
      backgroundColor="secondaryBackground"
      flex={1}
      paddingHorizontal="xl"
    >
      <KeyboardAvoidingView
        keyboardVerticalOffset={insets.top + spacing.l}
        behavior={Platform.OS === 'android' ? undefined : 'padding'}
        style={styles.container}
      >
        <Box alignItems="center" flex={1}>
          <Text
            variant="h1"
            textAlign="center"
            fontSize={44}
            lineHeight={44}
            marginTop="xl"
          >
            {t('accountAssign.title')}
          </Text>

          <Box
            backgroundColor="transparent10"
            borderRadius="xl"
            padding="m"
            width="100%"
            marginTop="xl"
            flexDirection="row"
          >
            <AccountIcon
              size={40}
              address={paths[0] && paths[0].keypair.publicKey.toBase58()}
            />
            <TextInput
              textColor="primaryText"
              fontSize={24}
              marginLeft="m"
              marginRight="xl"
              textInputProps={{
                placeholder: t('accountAssign.AccountNamePlaceholder'),
                autoCorrect: false,
                autoComplete: 'off',
                autoCapitalize: 'words',
                onChangeText: setAlias,
                value: alias,
                autoFocus: true,
              }}
            />
          </Box>

          <Box
            flexDirection="row"
            alignItems="center"
            marginTop="xl"
            opacity={hasAccounts ? 100 : 0}
          >
            <CheckBox
              disabled={!hasAccounts}
              value={setAsDefault}
              style={{ height: 20, width: 20 }}
              tintColors={{
                true: colors.primaryText,
                false: colors.transparent10,
              }}
              onCheckColor={colors.secondary}
              onTintColor={colors.primaryText}
              tintColor={colors.transparent10}
              onFillColor={colors.primaryText}
              onAnimationType="fill"
              offAnimationType="fill"
              boxType="square"
              onValueChange={onCheckboxToggled}
            />

            <Text
              variant="body1"
              color={setAsDefault ? 'primaryText' : 'secondaryText'}
              marginLeft="m"
            >
              {t('accountAssign.setDefault')}
            </Text>
          </Box>

          <Box flex={1} />

          <FabButton
            onPress={handlePress}
            icon="arrowRight"
            iconColor="primary"
            disabled={!alias}
            backgroundColor="primaryText"
            backgroundColorPressed="surfaceContrast"
            backgroundColorOpacityPressed={0.1}
          />
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaBox>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', flex: 1 },
})

export default memo(AccountAssignScreen)
