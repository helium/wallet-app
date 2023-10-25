import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { memo, useCallback, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { getUnixTime } from 'date-fns'
import { getBundleId } from 'react-native-device-info'
import {
  createLinkWalletCallbackUrl,
  LinkWalletResponse,
  makeAppLinkAuthToken,
} from '@helium/wallet-link'
import { NetTypes } from '@helium/address'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import AccountButton from '@components/AccountButton'
import useAlert from '@hooks/useAlert'
import { HomeNavigationProp } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { formatAccountAlias } from '../../utils/accountUtils'
import { checkSecureAccount, getKeypair } from '../../storage/secureStorage'
import {
  RootNavigationProp,
  RootStackParamList,
} from '../../navigation/rootTypes'
import sleep from '../../utils/sleep'

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

      Linking.openURL(url)

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

  const handleLink = useCallback(async () => {
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
    callback({ token, status: 'success' })
  }, [currentAccount, requestAppId, callbackUrl, appName, callback])

  const handleCancel = useCallback(async () => {
    callback({ status: 'user_cancelled' })
  }, [callback])

  useEffect(() => {
    // Only allow mainnet accounts to be linked

    if (currentAccount?.netType === NetTypes.MAINNET) return

    let mainnetAcct = sortedMainnetAccounts.length
      ? sortedMainnetAccounts[0]
      : null

    if (!mainnetAcct) {
      showOKAlert({
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

  const handleAccountButtonPress = useCallback(() => {
    if (!accountSelectorRef?.current) return
    accountSelectorRef.current.showAccountTypes(NetTypes.MAINNET)()
  }, [])

  return (
    <AccountSelector ref={accountSelectorRef}>
      <SafeAreaBox
        backgroundColor="primaryBackground"
        flex={1}
        padding="l"
        justifyContent="center"
      >
        <Text variant="body1" fontSize={32} marginTop="m">
          {t('linkWallet.title', { appName })}
        </Text>
        <Text variant="body1" marginVertical="m">
          {t('linkWallet.body', { appName })}
        </Text>

        <AccountButton
          accountIconSize={26}
          paddingVertical="l"
          title={formatAccountAlias(currentAccount)}
          address={currentAccount?.address}
          onPress={handleAccountButtonPress}
        />

        <TouchableOpacityBox
          marginTop="ms"
          minHeight={56}
          backgroundColor="surfaceContrast"
          justifyContent="center"
          borderRadius="round"
          onPress={handleLink}
        >
          <Text
            variant="subtitle1"
            color="surfaceContrastText"
            textAlign="center"
          >
            {t('linkWallet.yes')}
          </Text>
        </TouchableOpacityBox>

        <TouchableOpacityBox
          minHeight={56}
          justifyContent="center"
          backgroundColor="secondary"
          marginTop="ms"
          borderRadius="round"
          onPress={handleCancel}
        >
          <Text variant="subtitle1" color="primaryText" textAlign="center">
            {t('linkWallet.no')}
          </Text>
        </TouchableOpacityBox>
      </SafeAreaBox>
    </AccountSelector>
  )
}

export default memo(LinkWallet)
