import Close from '@assets/images/close.svg'
import SafeAreaBox from '@components/SafeAreaBox'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import Address from '@helium/address'
import { TokenBurnV1 } from '@helium/transactions'
import useAlert from '@hooks/useAlert'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useColors } from '@theme/themeHooks'
import React, { memo, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking } from 'react-native'
import { useDebouncedCallback } from 'use-debounce/lib'
import {
  RootNavigationProp,
  RootStackParamList,
} from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { getKeypair } from '../../storage/secureStorage'
import { HomeNavigationProp } from '../home/homeTypes'
import DappAccount from './DappAccount'
import DappConnect from './DappConnect'
import { useWalletConnect } from './WalletConnectProvider'

const makeBurnTxn = async (opts: { payerB58: string }) => {
  const { payerB58 } = opts

  const txn = new TokenBurnV1({
    amount: 1,
    payer: Address.fromB58(payerB58),
    // TODO: This must not be a global const or checksum fails for some reason??
    // This whole login process should go away anyway.
    payee: Address.fromB58(
      '13PuqyWXzPYeXcF1B9ZRx7RLkEygeL374ZABiQdwRSNzASdA1sn',
    ),
    nonce: 0,
    memo: '',
  })

  const txnJson = {
    type: txn.type,
    payee: txn.payee?.b58 || '',
    amount: 1,
    payer: txn.payer?.b58,
    nonce: txn.nonce,
    fee: txn.fee,
    memo: txn.memo,
  }

  const keypair = await getKeypair(payerB58)

  if (!keypair) throw new Error('Keypair not found')
  const signedTxn = await txn.sign({ payer: keypair })
  return { signedTxn, txnJson: JSON.stringify(txnJson), unsignedTxn: txn }
}

type Route = RouteProp<RootStackParamList, 'DappLoginScreen'>
const DappLoginScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { params } = route
  const {
    allowLogin,
    approvePair,
    connectionState,
    denyPair,
    disconnect,
    login,
    loginRequest,
    sessionProposal,
    pairClient,
  } = useWalletConnect()
  const { t } = useTranslation()
  const colors = useColors()
  const { currentAccount } = useAccountStorage()
  const { primaryText } = useColors()
  const { showOKAlert } = useAlert()
  const hasRequestedPair = useRef(false)

  useAsync(async () => {
    if (params.uri.includes('wc:') && !hasRequestedPair.current) {
      hasRequestedPair.current = true
      try {
        await pairClient(params.uri)
      } catch (error) {
        await showOKAlert({
          title: t('dappLogin.error', {
            appName: sessionProposal?.params.proposer.metadata.name,
          }),
          message: (error as Error).toString(),
        })
      }
    }
  }, [pairClient, params.callback, params.uri])

  const goBack = useCallback(async () => {
    await disconnect()

    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'TabBarNavigator' }],
      })
    }
  }, [disconnect, navigation, rootNav])

  const handleDeny = useCallback(async () => {
    await denyPair()
    await goBack()
  }, [denyPair, goBack])

  const handleAllowLogin = useDebouncedCallback(
    () => {
      allowLogin()
    },
    1000,
    {
      leading: true,
      trailing: false,
    },
  )

  const handleLogin = useCallback(async () => {
    if (!currentAccount?.address) return

    try {
      await approvePair(currentAccount.address)
    } catch (error) {
      await showOKAlert({
        title: t('dappLogin.error', {
          appName: sessionProposal?.params.proposer.metadata.name,
        }),
        message: (error as Error).toString(),
      })
    }
  }, [approvePair, currentAccount?.address, sessionProposal, showOKAlert, t])

  useAsync(async () => {
    if (!currentAccount?.address || !loginRequest) return

    const { signedTxn } = await makeBurnTxn({
      payerB58: currentAccount.address,
    })

    if (!signedTxn) return

    try {
      await login({
        txn: signedTxn.toString(),
        address: currentAccount.address,
      })
    } catch (error) {
      await showOKAlert({
        title: t('dappLogin.error', {
          appName: sessionProposal?.params.proposer.metadata.name,
        }),
        message: (error as Error).toString(),
      })
    }

    await goBack()

    if (params.callback && (await Linking.canOpenURL(params.callback))) {
      await Linking.openURL(params.callback)
    }
  }, [currentAccount?.address, loginRequest])

  const checkTimeoutError = useCallback(async () => {
    if (connectionState !== 'undetermined') return
    await showOKAlert({
      title: t('dappLogin.timeoutAlert.title'),
      message: t('dappLogin.timeoutAlert.message'),
    })
    await goBack()
  }, [connectionState, goBack, showOKAlert, t])

  // if connectionState doesn't update after 5 seconds show timeout error
  useEffect(() => {
    const timer = setTimeout(checkTimeoutError, 5000)
    return () => {
      clearTimeout(timer)
    }
  }, [connectionState, goBack, checkTimeoutError, showOKAlert, t])

  const body = useMemo(() => {
    if (!sessionProposal || connectionState === 'undetermined') {
      return (
        <SafeAreaBox backgroundColor="primaryBackground">
          <ActivityIndicator color={primaryText} />
        </SafeAreaBox>
      )
    }
    if (connectionState === 'proposal') {
      return (
        <DappConnect
          onApprove={handleAllowLogin}
          onDeny={handleDeny}
          appName={sessionProposal.params.proposer.metadata.name}
        />
      )
    }

    return (
      <DappAccount
        onLogin={handleLogin}
        appName={sessionProposal.params.proposer.metadata.name}
        onCancel={goBack}
        loading={connectionState !== 'allowed'}
      />
    )
  }, [
    connectionState,
    handleAllowLogin,
    handleDeny,
    handleLogin,
    sessionProposal,
    goBack,
    primaryText,
  ])

  return (
    <SafeAreaBox
      backgroundColor="primaryBackground"
      paddingHorizontal="l"
      flex={1}
    >
      <TouchableOpacityBox
        onPress={goBack}
        alignSelf="flex-end"
        justifyContent="center"
        paddingHorizontal="m"
        marginEnd="n_m"
      >
        <Close color={colors.white} height={21} width={21} />
      </TouchableOpacityBox>
      {body}
    </SafeAreaBox>
  )
}

export default memo(DappLoginScreen)
