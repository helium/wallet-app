import Address from '@helium/address'
import { Addressable, TokenBurnV1 } from '@helium/transactions'
import useAlert from '@hooks/useAlert'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { PressableScale } from '@ui/PressableScale'
import { Spinner } from '@ui/Spinner'
import { X } from 'lucide-react-native'
import React, { useCallback, useEffect, useEffectEvent, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { withUniwind } from 'uniwind'
import { useDebouncedCallback } from 'use-debounce'
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

const SafeArea = withUniwind(SafeAreaView)
const CloseIcon = withUniwind(X)

const makeBurnTxn = async (opts: { payerB58: string }) => {
  const { payerB58 } = opts

  const txn = new TokenBurnV1({
    amount: 1,
    payer: Address.fromB58(payerB58) as Addressable,
    // TODO: This must not be a global const or checksum fails for some reason??
    // This whole login process should go away anyway.
    payee: Address.fromB58(
      '13PuqyWXzPYeXcF1B9ZRx7RLkEygeL374ZABiQdwRSNzASdA1sn',
    ) as Addressable,
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
  const { currentAccount } = useAccountStorage()
  const { showOKAlert } = useAlert()
  const hasRequestedPair = useRef(false)

  const requestPair = useEffectEvent(async () => {
    const { uri } = params
    const appName = sessionProposal?.params.proposer.metadata.name
    if (uri.includes('wc:') && !hasRequestedPair.current) {
      hasRequestedPair.current = true
      try {
        await pairClient(uri)
      } catch (error) {
        await showOKAlert({
          title: t('dappLogin.error', { appName }),
          message: (error as Error).toString(),
        })
      }
    }
  })
  useEffect(() => {
    requestPair().catch((e) => console.error(e))
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

  const handleDeny = async () => {
    await denyPair()
    await goBack()
  }

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

  const currentAddress = currentAccount?.address
  const handleLogin = async () => {
    if (!currentAddress) return

    try {
      await approvePair(currentAddress)
    } catch (error) {
      await showOKAlert({
        title: t('dappLogin.error', {
          appName: sessionProposal?.params.proposer.metadata.name,
        }),
        message: (error as Error).toString(),
      })
    }
  }

  const loginWithBurnTxn = useEffectEvent(async () => {
    const address = currentAccount?.address
    const appName = sessionProposal?.params.proposer.metadata.name
    const { callback } = params
    if (!address || !loginRequest) return

    const { signedTxn } = await makeBurnTxn({ payerB58: address })

    if (!signedTxn) return

    try {
      await login({ txn: signedTxn.toString(), address })
    } catch (error) {
      await showOKAlert({
        title: t('dappLogin.error', { appName }),
        message: (error as Error).toString(),
      })
    }

    await goBack()

    if (callback && (await Linking.canOpenURL(callback))) {
      await Linking.openURL(callback)
    }
  })
  useEffect(() => {
    loginWithBurnTxn().catch((e) => console.error(e))
  }, [currentAccount?.address, loginRequest])

  const checkTimeoutError = useCallback(async () => {
    if (connectionState !== 'undetermined') return
    await showOKAlert({
      title: t('dappLogin.timeoutAlert.title'),
      message: t('dappLogin.timeoutAlert.message'),
    })
    await goBack()
  }, [connectionState, goBack, showOKAlert, t])

  // if connectionState doesn't update after 6 seconds show timeout error
  useEffect(() => {
    const timer = setTimeout(() => void checkTimeoutError(), 6000)
    return () => {
      clearTimeout(timer)
    }
  }, [connectionState, goBack, checkTimeoutError, showOKAlert, t])

  const renderBody = () => {
    if (!sessionProposal || connectionState === 'undetermined') {
      return (
        <SafeArea className="bg-background">
          <Spinner colorClassName="accent-foreground" />
        </SafeArea>
      )
    }
    if (connectionState === 'proposal') {
      return (
        <DappConnect
          onApprove={handleAllowLogin}
          onDeny={() => void handleDeny().catch(console.error)}
          appName={sessionProposal.params.proposer.metadata.name}
        />
      )
    }

    return (
      <DappAccount
        onLogin={() => void handleLogin().catch(console.error)}
        appName={sessionProposal.params.proposer.metadata.name}
        onCancel={() => void goBack().catch(console.error)}
        loading={connectionState !== 'allowed'}
      />
    )
  }

  return (
    <SafeArea className="flex-1 bg-background px-6">
      <PressableScale
        feedback="opacity"
        onPress={() => void goBack().catch(console.error)}
        accessibilityLabel={t('generic.close')}
        className="-me-4 justify-center self-end px-4"
      >
        <CloseIcon size={21} colorClassName="accent-foreground" />
      </PressableScale>
      {renderBody()}
    </SafeArea>
  )
}

export default DappLoginScreen
