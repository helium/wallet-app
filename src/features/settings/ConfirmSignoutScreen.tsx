import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { ActivityIndicator, Alert, Platform } from 'react-native'
import { useAsync } from 'react-async-hook'
import { useColors } from '@config/theme/themeHooks'
import Box from '@components/Box'
import { WalletNavigationProp } from '@services/WalletService/pages/WalletPage'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { getSecureAccount } from '@config/storage/secureStorage'
import { SettingsNavigationProp } from './settingsTypes'
import ConfirmWordsScreen from '../onboarding/create/ConfirmWordsScreen'
import { RootNavigationProp } from '../../app/rootTypes'

const ConfirmSignoutScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<
    WalletNavigationProp & SettingsNavigationProp
  >()
  const rootNav = useNavigation<RootNavigationProp>()
  const { currentAccount, signOut, accounts } = useAccountStorage()
  const colors = useColors()

  const [mnemonic, setMnemonic] = useState<string[]>()

  useAsync(async () => {
    if (!currentAccount || !currentAccount.address) return
    const secureAccount = await getSecureAccount(currentAccount.address)
    setMnemonic(secureAccount?.mnemonic)
  }, [currentAccount])

  const onWordsConfirmed = useCallback(() => {
    navigation.goBack()
    const currentAddress = currentAccount?.address
    const savedAccountAddresses = Object.keys(accounts || {})
    const isLastAccount =
      accounts &&
      currentAddress &&
      savedAccountAddresses.length === 1 &&
      savedAccountAddresses.includes(currentAddress)
    const iCloudMessage =
      Platform.OS === 'ios'
        ? t('settings.sections.account.signOutAlert.iCloudMessage')
        : ''

    Alert.alert(
      t('settings.sections.account.signOutAlert.title', {
        alias: currentAccount?.alias,
      }),
      t(
        `settings.sections.account.signOutAlert.${
          isLastAccount ? 'bodyLastAccount' : 'body'
        }`,
        {
          alias: currentAccount?.alias,
        },
      ) + iCloudMessage,
      [
        {
          text: t('generic.cancel'),
          style: 'cancel',
        },
        {
          text: t('settings.sections.account.signOut'),
          style: 'destructive',
          onPress: async () => {
            if (isLastAccount) {
              // last account is signing out, clear all storage then nav to onboarding
              await signOut()
              rootNav.replace('OnboardingNavigator')
            } else {
              // sign out the specific account, then nav to home
              await signOut(currentAccount)
              navigation.popToTop()
            }
          },
        },
      ],
    )
  }, [accounts, currentAccount, navigation, rootNav, signOut, t])

  if (!mnemonic) return null

  return (
    <Box padding="0" flex={1}>
      {mnemonic ? (
        <ConfirmWordsScreen
          title={t('settings.confirmSignout.title')}
          mnemonic={mnemonic}
          onComplete={onWordsConfirmed}
        />
      ) : (
        <Box flex={1} justifyContent="center" alignItems="center">
          <ActivityIndicator color={colors.primaryText} />
        </Box>
      )}
    </Box>
  )
}

export default ConfirmSignoutScreen
