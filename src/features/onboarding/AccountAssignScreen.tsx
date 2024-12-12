/* eslint-disable @typescript-eslint/no-shadow */
import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { heliumAddressFromSolAddress } from '@helium/spl-utils'
import CheckBox from '@react-native-community/checkbox'
import { CSAccountVersion } from '@config/storage/cloudStorage'
import {
  storeSecureAccount,
  toSecureAccount,
} from '@config/storage/secureStorage'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import { createHash } from 'crypto'
import React, { useCallback, useMemo, useState } from 'react'
import { useAsyncCallback } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { accountNetType } from '@utils/accountUtils'
import { ResolvedPath } from '@hooks/useDerivationAccounts'
import { useSolana } from '@features/solana/SolanaProvider'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import CheckButton from '@components/CheckButton'
import CircleLoader from '@components/CircleLoader'
import LoadingButton from '@components/LoadingButton'
import { useBottomSheet } from '@gorhom/bottom-sheet'
import { useOnboarding } from './OnboardingProvider'

const AccountAssignScreen = () => {
  const { connection } = useSolana()
  const { close } = useBottomSheet()

  const { t } = useTranslation()
  const [alias, setAlias] = useState('')
  const {
    onboardingData: { paths, words },
  } = useOnboarding()
  const insets = useSafeAreaInsets()
  const spacing = useSpacing()
  const colors = useColors()
  const {
    setCurrentAccount,
    upsertAccounts,
    hasAccounts,
    updateDefaultAccountAddress,
    accounts,
  } = useAccountStorage()
  const [setAsDefault, toggleSetAsDefault] = useState(false)

  const existingNames = useMemo(
    () => accounts && new Set(Object.values(accounts).map((a) => a.alias)),
    [accounts],
  )

  const allPaths = useMemo(() => {
    // if (
    //   route.params?.secretKey &&
    //   route.params?.derivationPath &&
    //   !paths.some((p) => p.derivationPath === route.params?.derivationPath)
    // ) {
    //   return [
    //     ...paths,
    //     {
    //       keypair: Keypair.fromSecretKey(
    //         Uint8Array.from(Buffer.from(route.params.secretKey, 'base64')),
    //       ),
    //       derivationPath: route.params.derivationPath,
    //     },
    //   ]
    // }
    return paths
  }, [paths])

  const storeAllSecureAccounts = useCallback(async () => {
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
  }, [words, allPaths])

  const generateMnemonicHash = (words?: string[]): string | undefined => {
    if (!words) return undefined
    return createHash('sha256').update(words.join(' ')).digest('hex')
  }

  const generateUniqueName = useCallback(
    (baseAlias: string, index: number): string => {
      const name = `${baseAlias} ${index + 1}`
      return existingNames?.has(name)
        ? generateUniqueName(baseAlias, index + 1)
        : name
    },
    [existingNames],
  )

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

  const { execute: handlePress, loading } = useAsyncCallback(async () => {
    try {
      await storeAllSecureAccounts()
      const mnemonicHash = generateMnemonicHash(words)
      const newAccounts = await createNewAccounts(allPaths, alias, mnemonicHash)
      const highestBalanceAcc = newAccounts.reduce((prev, current) =>
        (current.balance ?? 0) > (prev.balance ?? 0) ? current : prev,
      )

      await upsertAccounts(newAccounts)

      if (setAsDefault) {
        await updateDefaultAccountAddress(highestBalanceAcc.address)
      }

      if (hasAccounts) {
        close()
        // wait 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } else {
        // onboardingNav.navigate('AccountCreatePinScreen', {
        //   pinReset: true,
        // })
        close()
      }

      setCurrentAccount({
        ...highestBalanceAcc,
        netType: accountNetType(highestBalanceAcc.address),
      })
    } catch (e) {
      console.error(e)
    }
  })

  const onCheckboxToggled = useCallback(
    (newValue) => toggleSetAsDefault(newValue),
    [],
  )

  if (words?.length === 0 || !words) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" gap="xl">
        <CircleLoader type="blue" loaderSize={60} />
        <Text variant="displayMdSemibold" color="primaryText">
          {t('accountImport.privateKey.findingWallet')}
        </Text>
        <Text variant="textXlRegular" color="text.quaternary-500">
          {t('accountImport.privateKey.thisWontTakeLong')}
        </Text>
      </Box>
    )
  }

  return (
    <Box
      flex={1}
      justifyContent="center"
      alignItems="center"
      padding="2xl"
      flexDirection="column"
    >
      <KeyboardAvoidingView
        keyboardVerticalOffset={insets.top + spacing[6]}
        behavior={Platform.OS === 'android' ? undefined : 'padding'}
        style={{ ...styles.container, marginBottom: spacing['2xl'] }}
      >
        <Text
          variant="displayMdSemibold"
          textAlign="center"
          fontSize={44}
          lineHeight={44}
          marginTop="8"
          color="primaryText"
        >
          {t('accountAssign.title')}
        </Text>

        <Box
          backgroundColor="cardBackground"
          borderRadius="4xl"
          padding="4"
          width="100%"
          marginTop="8"
          flexDirection="row"
        >
          <AccountIcon
            size={40}
            address={paths[0] && paths[0].keypair.publicKey.toBase58()}
          />
          <Box backgroundColor="cardBackground">
            <TextInput
              textColor="primaryText"
              fontSize={24}
              marginLeft="4"
              marginRight="8"
              variant="transparentSmall"
              textInputProps={{
                placeholder: t('accountAssign.AccountNamePlaceholder'),
                autoCorrect: false,
                autoComplete: 'off',
                autoCapitalize: 'words',
                onChangeText: setAlias,
                value: alias,
                autoFocus: false,
              }}
            />
          </Box>
        </Box>

        <Box
          flexDirection="row"
          alignItems="center"
          marginTop="8"
          opacity={hasAccounts ? 100 : 0}
        >
          <CheckBox
            disabled={!hasAccounts}
            value={setAsDefault}
            style={{ height: 20, width: 20 }}
            tintColors={{
              true: colors.primaryText,
              false: colors.secondaryText,
            }}
            onCheckColor={colors.primaryBackground}
            onTintColor={colors.primaryText}
            tintColor={colors.secondaryText}
            onFillColor={colors.primaryText}
            onAnimationType="fill"
            offAnimationType="fill"
            boxType="square"
            onValueChange={onCheckboxToggled}
          />

          <Text
            variant="textMdSemibold"
            color={setAsDefault ? 'primaryText' : 'secondaryText'}
            marginLeft="4"
          >
            {t('accountAssign.setDefault')}
          </Text>
        </Box>

        <Box flex={1} />
        {!loading && existingNames?.has(alias) ? (
          <Text variant="textSmSemibold" mb="4" color="error.500">
            {t('accountAssign.nameExists')}
          </Text>
        ) : null}
      </KeyboardAvoidingView>
      {!loading && alias && <CheckButton onPress={handlePress} />}
      {loading && <LoadingButton />}
    </Box>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default AccountAssignScreen
