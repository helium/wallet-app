import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import CircleLoader from '@components/CircleLoader'
import FabButton from '@components/FabButton'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import CheckBox from '@react-native-community/checkbox'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Keypair } from '@solana/web3.js'
import { CSAccountVersion } from '@storage/cloudStorage'
import { storeSecureAccount, toSecureAccount } from '@storage/secureStorage'
import { useColors, useSpacing } from '@theme/themeHooks'
import { createHash } from 'crypto'
import React, { memo, useCallback, useMemo, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
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
  const { upsertAccounts, hasAccounts, updateDefaultAccountAddress, accounts } =
    useAccountStorage()
  const [setAsDefault, toggleSetAsDefault] = useState(false)

  const existingNames = useMemo(
    () => accounts && new Set(Object.values(accounts).map((a) => a.alias)),
    [accounts],
  )

  const allPaths = useMemo(() => {
    if (
      route.params?.secretKey &&
      route.params?.derivationPath &&
      !paths.some((p) => p.derivationPath === route.params?.derivationPath)
    ) {
      return [
        ...paths,
        {
          keypair: Keypair.fromSecretKey(
            Uint8Array.from(Buffer.from(route.params.secretKey, 'base64')),
          ),
          derivationPath: route.params.derivationPath,
        },
      ]
    }
    return paths
  }, [paths, route.params?.secretKey, route.params?.derivationPath])

  const { execute: handlePress, loading } = useAsyncCallback(async () => {
    try {
      await Promise.all(
        allPaths.map(async (p) => {
          await storeSecureAccount(
            toSecureAccount({
              keypair: p.keypair,
              words,
              derivationPath: p.derivationPath,
            }),
          )
        }),
      )
      // eslint-disable-next-line no-inner-declarations
      function getName(index: number): string {
        const name = `${alias} ${index + 1}`
        if (!existingNames?.has(name)) {
          return name
        }

        return getName(index + 1)
      }
      let mnemonicHash: string | undefined
      if (words) {
        mnemonicHash = createHash('sha256')
          .update(words.join(' '))
          .digest('hex')
      }
      const newAccounts = allPaths.map((p, index) => ({
        alias: index === 0 ? alias : getName(index),
        address: heliumAddressFromSolAddress(p.keypair.publicKey.toBase58()),
        solanaAddress: p.keypair.publicKey.toBase58(),
        derivationPath: p.derivationPath,
        mnemonicHash,
        version: 'v1' as CSAccountVersion,
      }))
      await Promise.all(
        allPaths.map(async (p) => {
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

      reset()
    } catch (e) {
      console.error(e)
      return
    }
    if (hasAccounts) {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'TabBarNavigator' }],
      })
    } else {
      onboardingNav.navigate('AccountCreatePinScreen', {
        pinReset: true,
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

export default memo(AccountAssignScreen)
