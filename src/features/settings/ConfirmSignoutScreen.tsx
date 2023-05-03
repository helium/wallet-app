import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import { ActivityIndicator, Alert, Platform } from 'react-native'
import { useAsync } from 'react-async-hook'
import useAlert from '@hooks/useAlert'
import { useColors } from '@theme/themeHooks'
import Box from '@components/Box'
import ConfirmWordsScreen from '../onboarding/create/ConfirmWordsScreen'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAppStorage } from '../../storage/AppStorageProvider'
import { SettingsNavigationProp } from './settingsTypes'
import { getSecureAccount } from '../../storage/secureStorage'
import { RootNavigationProp } from '../../navigation/rootTypes'

const ConfirmSignoutScreen = () => {
  const { t } = useTranslation()
  const navigation = useNavigation<
    HomeNavigationProp & SettingsNavigationProp
  >()
  const rootNav = useNavigation<RootNavigationProp>()
  const { showOKCancelAlert } = useAlert()
  const { currentAccount, signOut, accounts } = useAccountStorage()
  const { pin } = useAppStorage()
  const colors = useColors()

  const [mnemonic, setMnemonic] = useState<string[]>()

  useAsync(async () => {
    if (!currentAccount || !currentAccount.address) return
    const secureAccount = await getSecureAccount(currentAccount.address)
    setMnemonic(secureAccount?.mnemonic)
  }, [currentAccount])

  const isPinRequired = useMemo(
    () => pin !== undefined && pin.status !== 'off',
    [pin],
  )

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

  const onForgotWords = useCallback(async () => {
    navigation.goBack()
    const decision = await showOKCancelAlert({
      title: t('settings.confirmSignout.forgotAlert.title'),
      message: t('settings.confirmSignout.forgotAlert.body'),
    })
    if (!decision) return

    if (isPinRequired) {
      navigation.push('SettingsConfirmPin', {
        pin: pin?.value || '',
        action: 'revealWords',
      })
    } else {
      navigation.push('RevealWords')
    }
  }, [isPinRequired, navigation, pin, showOKCancelAlert, t])

  if (!mnemonic) return null

  return (
    <Box padding="none" flex={1}>
      {mnemonic ? (
        <ConfirmWordsScreen
          title={t('settings.confirmSignout.title')}
          mnemonic={mnemonic}
          onComplete={onWordsConfirmed}
          onForgotWords={onForgotWords}
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
