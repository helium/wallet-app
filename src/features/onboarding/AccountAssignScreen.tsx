import React, { memo, useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import CheckBox from '@react-native-community/checkbox'
import Box from '../../components/Box'
import SafeAreaBox from '../../components/SafeAreaBox'
import TextInput from '../../components/TextInput'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import FabButton from '../../components/FabButton'
import { useColors, useSpacing } from '../../theme/themeHooks'
import { useOnboarding } from './OnboardingProvider'
import AccountIcon from '../../components/AccountIcon'
import { accountNetType } from '../../utils/accountUtils'
import Text from '../../components/Text'
import { ImportAccountNavigationProp } from './import/importAccountNavTypes'
import { CreateAccountNavigationProp } from './create/createAccountNavTypes'
import { HomeNavigationProp } from '../home/homeTypes'

const AccountAssignScreen = () => {
  const onboardingNav = useNavigation<
    ImportAccountNavigationProp & CreateAccountNavigationProp
  >()
  const homeNav = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const [alias, setAlias] = useState('')
  const {
    reset,
    onboardingData: { secureAccount },
  } = useOnboarding()
  const insets = useSafeAreaInsets()
  const spacing = useSpacing()
  const colors = useColors()
  const { upsertAccount, hasAccounts, updateDefaultAccountAddress } =
    useAccountStorage()
  const [setAsDefault, toggleSetAsDefault] = useState(false)

  const handlePress = useCallback(async () => {
    if (!secureAccount) return

    if (hasAccounts) {
      try {
        await upsertAccount({
          alias,
          address: secureAccount.address,
          secureAccount,
        })
        if (setAsDefault) {
          await updateDefaultAccountAddress(secureAccount.address)
        }
        homeNav.navigate('AccountsScreen')
        reset()
        return
      } catch (e) {
        console.error(e)
        return
      }
    }

    onboardingNav.navigate('AccountCreatePinScreen', {
      pinReset: false,
      account: {
        ...secureAccount,
        alias,
        netType: accountNetType(secureAccount.address),
      },
    })
  }, [
    secureAccount,
    hasAccounts,
    onboardingNav,
    alias,
    upsertAccount,
    setAsDefault,
    homeNav,
    reset,
    updateDefaultAccountAddress,
  ])

  const onCheckboxToggled = useCallback(
    (newValue) => toggleSetAsDefault(newValue),
    [],
  )

  return (
    <SafeAreaBox backgroundColor="secondary" flex={1} paddingHorizontal="xl">
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
            <AccountIcon size={40} address={secureAccount?.address} />
            <TextInput
              textColor="primaryText"
              onChangeText={setAlias}
              value={alias}
              fontSize={24}
              placeholder={t('accountAssign.AccountNamePlaceholder')}
              autoCorrect={false}
              autoComplete="off"
              autoCapitalize="words"
              marginLeft="m"
              marginRight="xl"
              autoFocus
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
