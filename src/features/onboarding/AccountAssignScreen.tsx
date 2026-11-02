/* eslint-disable @typescript-eslint/no-shadow */
import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { Keypair } from '@solana/web3.js'
import { CSAccountVersion } from '@storage/cloudStorage'
import {
  deleteSecureAccount,
  storeSecureAccount,
  toSecureAccount,
} from '@storage/secureStorage'
import { useMutation } from '@tanstack/react-query'
import { AccountIcon } from '@ui/AccountIcon'
import { Button } from '@ui/Button'
import { Checkbox } from '@ui/Checkbox'
import { Input } from '@ui/Input'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import { createHash } from 'crypto'
import { ArrowRight } from 'lucide-react-native'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import {
  SafeAreaView as RNSafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { accountNetType } from '@utils/accountUtils'
import { ResolvedPath } from '@hooks/useDerivationAccounts'
import { RootNavigationProp } from '../../navigation/rootTypes'
import { useSolana } from '../../solana/SolanaProvider'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { HomeStackParamList } from '../home/homeTypes'
import { CreateAccountNavigationProp } from './create/createAccountNavTypes'
import { ImportAccountNavigationProp } from './import/importAccountNavTypes'
import { useOnboarding } from './OnboardingProvider'

const SafeAreaView = withUniwind(RNSafeAreaView)
const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView)
const ContinueIcon = withUniwind(ArrowRight)

type Route = RouteProp<HomeStackParamList, 'AccountAssignScreen'>

const AccountAssignScreen = () => {
  const route = useRoute<Route>()
  const { connection } = useSolana()
  const onboardingNav = useNavigation<
    ImportAccountNavigationProp & CreateAccountNavigationProp
  >()
  const rootNav = useNavigation<RootNavigationProp>()
  const [error, setError] = useState<string | null>(null)

  const { t } = useTranslation()
  const [alias, setAlias] = useState('')
  const {
    reset,
    onboardingData: { paths, words },
  } = useOnboarding()
  const insets = useSafeAreaInsets()
  const {
    setCurrentAccount,
    upsertAccounts,
    hasAccounts,
    updateDefaultAccountAddress,
    accounts,
  } = useAccountStorage()
  const [setAsDefault, toggleSetAsDefault] = useState(false)

  const existingNames =
    accounts && new Set(Object.values(accounts).map((a) => a.alias))

  const allPaths = (() => {
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
  })()

  const storeAllSecureAccounts = async () => {
    const secureAccounts = allPaths
      .slice()
      .reverse()
      .map((path) =>
        toSecureAccount({
          words,
          keypair: path.keypair,
          derivationPath: path.derivationPath,
        }),
      )

    await Promise.all(secureAccounts.map(storeSecureAccount))
  }

  const generateMnemonicHash = (words?: string[]): string | undefined => {
    if (!words) return undefined
    return createHash('sha256').update(words.join(' ')).digest('hex')
  }

  const generateUniqueName = (baseAlias: string, index: number): string => {
    let i = index
    while (existingNames?.has(`${baseAlias} ${i + 1}`)) i += 1
    return `${baseAlias} ${i + 1}`
  }

  const createNewAccounts = async (
    paths: ResolvedPath[],
    alias: string,
    mnemonicHash?: string,
  ) => {
    return Promise.all(
      paths.map(async (p, index) => ({
        alias: index === 0 ? alias : generateUniqueName(alias, index),
        address: heliumAddressFromSolAddress(p.keypair.publicKey.toBase58()),
        solanaAddress: p.keypair.publicKey.toBase58(),
        derivationPath: p.derivationPath,
        mnemonicHash,
        version: 'v1' as CSAccountVersion,
        balance: (await connection?.getBalance(p.keypair.publicKey)) ?? 0,
      })),
    )
  }

  const { mutate: handlePress, isPending: loading } = useMutation({
    mutationFn: async () => {
      try {
        await storeAllSecureAccounts()
        const mnemonicHash = generateMnemonicHash(words)
        const newAccounts = await createNewAccounts(
          allPaths,
          alias,
          mnemonicHash,
        )

        // This only happens when the user proceeds too quickly through this screen.
        if (newAccounts.length === 0) {
          return
        }

        const highestBalanceAcc = newAccounts.reduce(
          (prev, current) =>
            (current.balance ?? 0) > (prev.balance ?? 0) ? current : prev,
          newAccounts[0],
        )

        try {
          await upsertAccounts(newAccounts)
        } catch (e) {
          // A key stored for an unlisted account would outlive sign-out
          await Promise.all(
            newAccounts
              .filter((acc) => !accounts?.[acc.address])
              .map((acc) =>
                deleteSecureAccount({
                  ...acc,
                  netType: accountNetType(acc.address),
                }),
              ),
          ).catch(console.error)
          throw e
        }

        if (setAsDefault) {
          await updateDefaultAccountAddress(highestBalanceAcc.address)
        }

        if (hasAccounts) {
          rootNav.reset({
            index: 0,
            routes: [{ name: 'TabBarNavigator' }],
          })
          reset()
        } else {
          onboardingNav.navigate('AccountCreatePinScreen', {
            pinReset: true,
          })
        }

        setCurrentAccount({
          ...highestBalanceAcc,
          netType: accountNetType(highestBalanceAcc.address),
        })
      } catch (e) {
        setError(String(e))
        console.error(e)
      }
    },
  })

  return (
    <SafeAreaView className="flex-1 bg-navy px-8">
      <FocusAwareStatusBar barStyle="light-content" />
      <StyledKeyboardAvoidingView
        keyboardVerticalOffset={insets.top + 24}
        behavior={Platform.OS === 'android' ? undefined : 'padding'}
        className="w-full flex-1"
      >
        <View className="flex-1 items-center">
          <Text
            size="4xl"
            className="mt-8 text-center font-medium text-navy-foreground"
          >
            {t('accountAssign.title')}
          </Text>

          <View className="mt-8 w-full flex-row items-center rounded-3xl bg-navy-glass p-4">
            <AccountIcon
              size={40}
              address={paths[0] && paths[0].keypair.publicKey.toBase58()}
            />
            <Input
              testID="AccountAssign.Alias"
              placeholder={t('accountAssign.AccountNamePlaceholder')}
              autoCorrect={false}
              autoComplete="off"
              autoCapitalize="words"
              onChangeText={setAlias}
              value={alias}
              autoFocus
              keyboardAppearance="dark"
              placeholderTextColorClassName="accent-navy-foreground/50"
              className="ml-4 mr-8 h-12 flex-1 border-0 px-0 text-2xl text-navy-foreground shadow-none"
            />
          </View>

          <View
            className={
              hasAccounts
                ? 'mt-8 flex-row items-center'
                : 'mt-8 flex-row items-center opacity-0'
            }
          >
            <Checkbox
              disabled={!hasAccounts}
              checked={setAsDefault}
              onChange={toggleSetAsDefault}
              className={
                setAsDefault
                  ? 'size-5 border-purple-500 bg-purple-500'
                  : 'size-5 border-navy-foreground/50'
              }
            />

            <Text
              size="base"
              className={
                setAsDefault
                  ? 'ml-4 text-navy-foreground'
                  : 'ml-4 text-navy-foreground/50'
              }
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
          {error ? (
            <Text className="mb-4 text-destructive">{error}</Text>
          ) : null}
          {loading ? (
            <Spinner colorClassName="accent-navy-foreground" />
          ) : (
            <Button
              testID="AccountAssign.Continue"
              variant="cta"
              size="icon"
              className="size-12 rounded-full"
              onPress={() => handlePress()}
              disabled={!alias || existingNames?.has(alias)}
            >
              <ContinueIcon size={20} colorClassName="accent-navy-foreground" />
            </Button>
          )}
        </View>
      </StyledKeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default AccountAssignScreen
