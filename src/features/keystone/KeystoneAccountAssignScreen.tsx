import { AccountIcon } from '@ui/AccountIcon'
import { Checkbox } from '@ui/Checkbox'
import { FabButton } from '@ui/FabButton'
import { Input } from '@ui/Input'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { useNavigation } from '@react-navigation/native'
import { useMutation } from '@tanstack/react-query'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import base58 from 'bs58'
import { CSAccountVersion } from '@storage/cloudStorage'
import { hex } from '@anchor-lang/core/dist/cjs/utils/bytes'
import { PublicKey } from '@solana/web3.js'
import Address from '@helium/address'
import { ED25519_KEY_TYPE } from '@helium/address/build/KeyTypes'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { ImportAccountNavigationProp } from '../onboarding/import/importAccountNavTypes'
import { CreateAccountNavigationProp } from '../onboarding/create/createAccountNavTypes'
import { useKeystoneOnboarding } from './KeystoneOnboardingProvider'

const SafeArea = withUniwind(TabSafeAreaView)

// Restyle spacing `l`, kept as the keyboard offset below the top inset
const KEYBOARD_OFFSET = 24

const KeystoneAccountAssignScreen = () => {
  const onboardingNav = useNavigation<
    ImportAccountNavigationProp & CreateAccountNavigationProp
  >()
  const rootNav = useNavigation<RootNavigationProp>()
  const { t } = useTranslation()
  const [alias, setAlias] = useState('')
  const { keystoneOnboardingData } = useKeystoneOnboarding()
  const insets = useSafeAreaInsets()
  const { hasAccounts, accounts } = useAccountStorage()
  const [setAsDefault, toggleSetAsDefault] = useState(false)

  const existingNames =
    accounts && new Set(Object.values(accounts).map((a) => a.alias))
  const accountStorage = useAccountStorage()
  const {
    mutate: handlePress,
    isPending: loading,
    error,
  } = useMutation({
    mutationFn: async () => {
      const getName = (index: number): string => {
        const name = `${alias} ${index + 1}`
        if (!existingNames?.has(name)) {
          return name
        }
        return getName(index + 1)
      }

      // convert solana public key to helium address
      const solanaPublicKeyToHeliumAddress = (publicKey: string): string => {
        const pkey = new PublicKey(hex.decode(publicKey))
        const heliumAddr = new Address(0, 0, ED25519_KEY_TYPE, pkey.toBytes())
        const heliumAddress = heliumAddr.b58
        return heliumAddress
      }
      const accountBulk = keystoneOnboardingData.accounts.map(
        (account, index) => ({
          alias: getName(index),
          address: solanaPublicKeyToHeliumAddress(
            keystoneOnboardingData.accounts[index].publicKey,
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
      await accountStorage.upsertAccounts(accountBulk)

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
    },
  })

  return (
    <SafeArea className="flex-1 bg-secondary px-8">
      <KeyboardAvoidingView
        keyboardVerticalOffset={insets.top + KEYBOARD_OFFSET}
        behavior={Platform.OS === 'android' ? undefined : 'padding'}
        className="w-full flex-1"
      >
        <View className="flex-1 items-center">
          <Text size="4xl" className="mt-8 text-center">
            {t('accountAssign.title')}
          </Text>

          <View className="mt-8 w-full flex-row items-center rounded-[20px] bg-card p-4">
            <AccountIcon
              size={40}
              address={
                keystoneOnboardingData.accounts[0] &&
                base58.encode(
                  Buffer.from(keystoneOnboardingData.accounts[0].publicKey),
                )
              }
            />
            <Input
              variant="form"
              className="ml-4 flex-1"
              placeholder={t('accountAssign.AccountNamePlaceholder')}
              autoCorrect={false}
              autoComplete="off"
              autoCapitalize="words"
              onChangeText={setAlias}
              value={alias}
              autoFocus
            />
          </View>

          <View
            className={`mt-8 flex-row items-center ${
              hasAccounts ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Checkbox
              disabled={!hasAccounts}
              checked={setAsDefault}
              onChange={toggleSetAsDefault}
            />

            <Text
              size="base"
              className={`ml-4 ${
                setAsDefault ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {t('accountAssign.setDefault')}
            </Text>
          </View>

          <View className="flex-1" />
          {!loading && existingNames?.has(alias) ? (
            <Text className="mb-4 text-destructive">
              {t('accountAssign.nameExists')}
            </Text>
          ) : null}
          {!loading && error ? (
            <Text className="mb-4 text-destructive">{error.message}</Text>
          ) : null}
          {loading ? (
            <Spinner />
          ) : (
            <FabButton
              onPress={() => handlePress()}
              icon="arrowRight"
              tone="primary"
              disabled={!alias || existingNames?.has(alias)}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeArea>
  )
}

export default KeystoneAccountAssignScreen
