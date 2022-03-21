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
    <SafeAreaBox
      backgroundColor="primaryBackground"
      flex={1}
      paddingHorizontal={{ smallPhone: 'l', phone: 'xxxl' }}
      paddingVertical={Platform.OS === 'android' ? 'xxl' : undefined}
    >
      <KeyboardAvoidingView
        keyboardVerticalOffset={insets.top + spacing.l}
        behavior={Platform.OS === 'android' ? undefined : 'padding'}
        style={styles.container}
      >
        <Box alignItems="center" flex={1}>
          <AccountIcon size={84} address={secureAccount?.address} />

          <TextInput
            onChangeText={setAlias}
            variant="underline"
            value={alias}
            placeholder={t('accountAssign.AccountNamePlaceholder')}
            autoCorrect={false}
            autoComplete="off"
            marginTop="xl"
            autoCapitalize="words"
            width="100%"
          />

          <Box
            flexDirection="row"
            alignItems="center"
            marginTop="xl"
            opacity={hasAccounts ? 100 : 0}
          >
            <CheckBox
              disabled={!hasAccounts}
              value={setAsDefault}
              tintColors={{
                true: colors.purple500,
                false: colors.surfaceSecondary,
              }}
              onCheckColor={colors.purple500}
              onTintColor={colors.purple500}
              tintColor={colors.surfaceSecondary}
              onAnimationType="fill"
              offAnimationType="fill"
              boxType="square"
              onValueChange={onCheckboxToggled}
            />

            <Text
              variant="body1"
              color="secondaryText"
              marginLeft={Platform.OS === 'ios' ? 'm' : 's'}
            >
              {t('accountAssign.setDefault')}
            </Text>
          </Box>

          <Box flex={1} />

          <FabButton
            onPress={handlePress}
            icon="arrowRight"
            disabled={!alias}
            backgroundColor="surface"
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
