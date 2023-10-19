import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import FabButton from '@components/FabButton'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import CheckBox from '@react-native-community/checkbox'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useColors, useSpacing } from '@theme/themeHooks'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CircleLoader from '@components/CircleLoader'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { accountNetType } from '../../utils/accountUtils'
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
  const [upserting, setUpserting] = useState(false)
  const {
    reset,
    onboardingData: { secureAccount },
  } = useOnboarding()
  const insets = useSafeAreaInsets()
  const spacing = useSpacing()
  const colors = useColors()
  const { accounts, upsertAccount, hasAccounts, updateDefaultAccountAddress } =
    useAccountStorage()
  const [setAsDefault, toggleSetAsDefault] = useState(false)

  const account = useMemo(() => {
    return secureAccount || route?.params?.secureAccount
  }, [route, secureAccount])

  const handlePress = useCallback(async () => {
    if (!account) return

    if (hasAccounts) {
      const aliasExists = !!Object.values(accounts || {}).find(
        (acc) => acc.alias === alias,
      )

      const execute = async () => {
        setUpserting(true)

        try {
          await upsertAccount({
            alias,
            address: account.address,
            secureAccount: account,
          })

          if (setAsDefault) {
            await updateDefaultAccountAddress(account.address)
          }

          rootNav.reset({
            index: 0,
            routes: [{ name: 'TabBarNavigator' }],
          })
          reset()
          return
        } catch (e) {
          setUpserting(false)
          console.error(e)
        }
      }

      if (aliasExists) {
        Alert.alert(
          t('settings.sections.account.overwriteWalletAlert.title', {
            alias,
          }),
          t('settings.sections.account.overwriteWalletAlert.body', {
            alias,
          }),
          [
            {
              text: t('generic.cancel'),
              style: 'cancel',
            },
            {
              text: t('settings.sections.account.overwriteWallet'),
              style: 'destructive',
              onPress: execute,
            },
          ],
        )
      } else {
        await execute()
      }
    } else {
      onboardingNav.navigate('AccountCreatePinScreen', {
        pinReset: false,
        account: {
          ...account,
          alias,
          netType: accountNetType(account.address),
        },
      })
    }
  }, [
    t,
    accounts,
    account,
    hasAccounts,
    onboardingNav,
    alias,
    upsertAccount,
    setAsDefault,
    reset,
    updateDefaultAccountAddress,
    rootNav,
    setUpserting,
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
            <AccountIcon size={40} address={account?.address} />
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

          {upserting ? (
            <CircleLoader color="white" loaderSize={40} />
          ) : (
            <FabButton
              onPress={handlePress}
              icon="arrowRight"
              iconColor="primary"
              disabled={!alias}
              backgroundColor="primaryText"
              backgroundColorPressed="surfaceContrast"
              backgroundColorOpacityPressed={0.1}
            />
          )}
        </Box>
      </KeyboardAvoidingView>
    </SafeAreaBox>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%', flex: 1 },
})

export default memo(AccountAssignScreen)
