import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { getUnixTime } from 'date-fns'
import { getBundleId } from 'react-native-device-info'
import {
  createLinkWalletCallbackUrl,
  LinkWalletResponse,
  makeAppLinkAuthToken,
} from '@helium/wallet-link'
import { NetTypes } from '@helium/address'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import AccountButton from '@components/AccountButton'
import useAlert from '@hooks/useAlert'
import { Button } from '@ui/Button'
import { Text } from '@ui/Text'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { formatAccountAlias } from '../../utils/accountUtils'
import { checkSecureAccount, getKeypair } from '../../storage/secureStorage'
import {
  RootNavigationProp,
  RootStackParamList,
} from '../../navigation/rootTypes'
import sleep from '../../utils/sleep'

const SafeArea = withUniwind(SafeAreaView)

type Route = RouteProp<RootStackParamList, 'LinkWallet'>
const LinkWallet = () => {
  const {
    params: { requestAppId, callbackUrl, appName },
  } = useRoute<Route>()
  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { t } = useTranslation()
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const {
    currentAccount,
    setCurrentAccount,
    sortedMainnetAccounts,
    accounts,
    defaultAccountAddress,
  } = useAccountStorage()
  const { showOKAlert } = useAlert()

  const callback = useCallback(
    async (responseParams: LinkWalletResponse) => {
      const url = createLinkWalletCallbackUrl(
        callbackUrl,
        currentAccount?.address || '',
        responseParams,
      )

      void Linking.openURL(url)

      // Wait a moment before going back so the ui doesn't jump
      await sleep(300)
      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        rootNav.reset({
          index: 0,
          routes: [{ name: 'TabBarNavigator' }],
        })
      }
    },
    [callbackUrl, currentAccount?.address, navigation, rootNav],
  )

  const handleLink = async () => {
    if (!currentAccount?.address) return
    const keypair = await getKeypair(currentAccount.address)
    if (!keypair) {
      await checkSecureAccount(currentAccount?.address, true)
      return
    }

    const time = getUnixTime(new Date())
    const token = await makeAppLinkAuthToken(
      {
        time,
        address: currentAccount.address,
        requestAppId,
        signingAppId: getBundleId(),
        callbackUrl,
        appName,
      },
      keypair,
    )
    await callback({ token, status: 'success' })
  }

  const handleCancel = useCallback(async () => {
    await callback({ status: 'user_cancelled' })
  }, [callback])

  useEffect(() => {
    // Only allow mainnet accounts to be linked

    if (currentAccount?.netType === NetTypes.MAINNET) return

    let mainnetAcct = sortedMainnetAccounts.length
      ? sortedMainnetAccounts[0]
      : null

    if (!mainnetAcct) {
      void showOKAlert({
        title: t('linkWallet.noWallet.title'),
        message: t('linkWallet.noWallet.message'),
      }).then(navigation.goBack)
      return
    }
    const defaultAccount = accounts?.[defaultAccountAddress || '']
    if (defaultAccount?.netType === NetTypes.MAINNET) {
      mainnetAcct = defaultAccount
    }
    setCurrentAccount(mainnetAcct)
  }, [
    accounts,
    currentAccount,
    defaultAccountAddress,
    handleCancel,
    navigation.goBack,
    setCurrentAccount,
    showOKAlert,
    sortedMainnetAccounts,
    t,
  ])

  const handleAccountButtonPress = () => {
    if (!accountSelectorRef?.current) return
    accountSelectorRef.current.showAccountTypes(NetTypes.MAINNET)()
  }

  return (
    <AccountSelector ref={accountSelectorRef}>
      <SafeArea className="flex-1 justify-center bg-background p-6">
        <Text size="3xl" className="mt-4">
          {t('linkWallet.title', { appName })}
        </Text>
        <Text size="base" className="my-4">
          {t('linkWallet.body', { appName })}
        </Text>

        <AccountButton
          accountIconSize={26}
          paddingVertical="l"
          title={formatAccountAlias(currentAccount)}
          address={currentAccount?.address}
          onPress={handleAccountButtonPress}
        />

        <Button
          variant="cta"
          size="lg"
          className="mt-3 w-full"
          onPress={() => void handleLink().catch(console.error)}
        >
          {t('linkWallet.yes')}
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="mt-3 w-full"
          onPress={() => void handleCancel().catch(console.error)}
        >
          {t('linkWallet.no')}
        </Button>
      </SafeArea>
    </AccountSelector>
  )
}

export default LinkWallet
