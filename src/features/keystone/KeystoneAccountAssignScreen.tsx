import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import FabButton from '@components/FabButton'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import CheckBox from '@react-native-community/checkbox'
import { useNavigation } from '@react-navigation/native'
import { useColors, useSpacing } from '@theme/themeHooks'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import base58 from 'bs58'
import { CSAccountVersion } from '@storage/cloudStorage'
import { hex } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { ImportAccountNavigationProp } from '../onboarding/import/importAccountNavTypes'
import { CreateAccountNavigationProp } from '../onboarding/create/createAccountNavTypes'
import { useKeystoneOnboarding } from './KeystoneOnboardingProvider'

const KeystoneAccountAssignScreen = () => {
  const onboardingNav = useNavigation<
    ImportAccountNavigationProp & CreateAccountNavigationProp
  >()
  const rootNav = useNavigation<RootNavigationProp>()
  const { t } = useTranslation()
  const [alias, setAlias] = useState('')
  const { keystoneOnboardingData } = useKeystoneOnboarding()
  const insets = useSafeAreaInsets()
  const spacing = useSpacing()
  const colors = useColors()
  const { hasAccounts, accounts } = useAccountStorage()
  const [setAsDefault, toggleSetAsDefault] = useState(false)

  const existingNames = useMemo(
    () => accounts && new Set(Object.values(accounts).map((a) => a.alias)),
    [accounts],
  )
  const accountStorage = useAccountStorage()
  const { execute: handlePress, loading } = useAsyncCallback(async () => {
    const getName = (index: number): string => {
      const name = `${alias} ${index + 1}`
      if (!existingNames?.has(name)) {
        return name
      }
      return getName(index + 1)
    }

    const accountBulk = keystoneOnboardingData.accounts.map(
      (account, index) => ({
        alias: getName(index),
        address: base58.encode(
          hex.decode(keystoneOnboardingData.accounts[index].publicKey),
        ),
        solanaAddress: base58.encode(
          hex.decode(keystoneOnboardingData.accounts[index].publicKey),
        ),
        derivationPath: account.path,
        keystoneDevice: {
          masterFingerprint: account.masterFingerprint,
          device: account.device,
        },
        version: 'v1' as CSAccountVersion,
      }),
    )
    accountStorage.upsertAccounts(accountBulk)

    if (hasAccounts) {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'TabBarNavigator' }],
      })
    } else {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      onboardingNav.replace('CreateAccount', {
        screen: 'AccountCreatePinScreen',
        params: {
          pinReset: true,
        },
      })
    }
  })

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
              address={
                keystoneOnboardingData.accounts[0] &&
                base58.encode(
                  Buffer.from(keystoneOnboardingData.accounts[0].publicKey),
                )
              }
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
          {!loading && existingNames?.has(alias) ? (
            <Text mb="m" color="red500">
              {t('accountAssign.nameExists')}
            </Text>
          ) : null}
          {loading ? (
            <CircleLoader />
          ) : (
            <FabButton
              onPress={handlePress}
              icon="arrowRight"
              iconColor="primary"
              disabled={!alias || existingNames?.has(alias)}
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

export default memo(KeystoneAccountAssignScreen)
