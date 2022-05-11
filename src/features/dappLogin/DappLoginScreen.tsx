import { TokenBurnV1 } from '@helium/transactions'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking } from 'react-native'
import { useDebouncedCallback } from 'use-debounce/lib'
import Close from '@assets/images/close.svg'
import { useAsync } from 'react-async-hook'
import LedgerBurn, { LedgerBurnRef } from '../../components/LedgerBurn'
import { encodeMemoString } from '../../components/MemoInput'
import SafeAreaBox from '../../components/SafeAreaBox'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  EMPTY_B58_ADDRESS,
  useTransactions,
} from '../../storage/TransactionProvider'
import { useColors } from '../../theme/themeHooks'
import useAlert from '../../utils/useAlert'
import useDisappear from '../../utils/useDisappear'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import { useWalletConnect } from './WalletConnectProvider'
import DappConnect from './DappConnect'
import DappAccount from './DappAccount'

type Route = RouteProp<HomeStackParamList, 'DappLoginScreen'>
const DappLoginScreen = () => {
  const route = useRoute<Route>()
  const navigation = useNavigation<HomeNavigationProp>()
  const { params } = route
  const {
    pairClient,
    loginProposal,
    loginRequestEvent,
    approvePair,
    denyPair,
    reset,
    login,
  } = useWalletConnect()
  const { t } = useTranslation()
  const colors = useColors()
  const { currentAccount } = useAccountStorage()
  const { makeBurnTxn } = useTransactions()
  const { primaryText } = useColors()
  const { showOKAlert } = useAlert()
  const ledgerPaymentRef = useRef<LedgerBurnRef>(null)
  const hasRequestedPair = useRef(false)

  useAsync(async () => {
    if (params.uri.includes('wc:') && !hasRequestedPair.current) {
      hasRequestedPair.current = true
      try {
        await pairClient(params.uri)
      } catch (error) {
        showOKAlert({
          title: t('dappLogin.error', {
            app: loginProposal?.proposer.metadata.name,
          }),
          message: (error as Error).toString(),
        })
      }
    }
  }, [pairClient, params.callback, params.uri])

  useDisappear(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
    reset()
  })

  const handleDeny = useCallback(async () => {
    await denyPair()
    navigation.goBack()
  }, [denyPair, navigation])

  const handleApprove = useDebouncedCallback(
    async () => {
      try {
        await approvePair()
      } catch (error) {
        showOKAlert({
          title: t('dappLogin.error', {
            app: loginProposal?.proposer.metadata.name,
          }),
          message: (error as Error).toString(),
        })
      }
    },
    1000,
    {
      leading: true,
      trailing: false,
    },
  )

  const handleLogin = useCallback(async () => {
    if (!currentAccount) return

    const isLedger = !!currentAccount.ledgerDevice

    const { signedTxn, unsignedTxn, txnJson } = await makeBurnTxn({
      payeeB58: EMPTY_B58_ADDRESS.b58,
      amount: 1,
      memo: encodeMemoString('test') || '',
      nonce: 0,
      shouldSign: !isLedger,
    })

    if (isLedger && currentAccount.ledgerDevice) {
      ledgerPaymentRef.current?.show({
        unsignedTxn,
        ledgerDevice: currentAccount.ledgerDevice,
        txnJson,
      })
      return
    }

    if (!signedTxn) return

    try {
      await login({
        txn: signedTxn.toString(),
        address: currentAccount.address,
      })
    } catch (error) {
      showOKAlert({
        title: t('dappLogin.error', {
          app: loginProposal?.proposer.metadata.name,
        }),
        message: (error as Error).toString(),
      })
    }

    navigation.goBack()

    if (await Linking.canOpenURL(params.callback)) {
      Linking.openURL(params.callback)
    }
  }, [
    currentAccount,
    login,
    loginProposal,
    makeBurnTxn,
    navigation,
    params.callback,
    showOKAlert,
    t,
  ])

  const ledgerPaymentConfirmed = useCallback(
    async ({ txn: signedTxn }: { txn: TokenBurnV1; txnJson: string }) => {
      if (!currentAccount) return

      login({
        txn: signedTxn.toString(),
        address: currentAccount.address,
      })

      navigation.goBack()
    },
    [currentAccount, login, navigation],
  )

  const handleLedgerError = useCallback(
    async (error: Error) => {
      await showOKAlert({
        title: t('generic.error'),
        message: error.toString(),
      })
      navigation.goBack()
    },
    [navigation, showOKAlert, t],
  )

  const body = useMemo(() => {
    if (!loginProposal) {
      return (
        <SafeAreaBox backgroundColor="primaryBackground">
          <ActivityIndicator color={primaryText} />
        </SafeAreaBox>
      )
    }
    if (!loginRequestEvent) {
      return (
        <DappConnect
          onApprove={handleApprove}
          onDeny={handleDeny}
          appName={loginProposal.proposer.metadata.name}
        />
      )
    }

    return (
      <DappAccount
        onLogin={handleLogin}
        appName={loginProposal.proposer.metadata.name}
        onCancel={navigation.goBack}
      />
    )
  }, [
    handleApprove,
    handleDeny,
    handleLogin,
    loginProposal,
    loginRequestEvent,
    navigation.goBack,
    primaryText,
  ])

  return (
    <LedgerBurn
      ref={ledgerPaymentRef}
      onConfirm={ledgerPaymentConfirmed}
      onError={handleLedgerError}
      title={t('dappLogin.ledger.title')}
      subtitle={t('dappLogin.ledger.subtitle', {
        name: currentAccount?.ledgerDevice?.name,
        app: loginProposal?.proposer.metadata.name,
      })}
    >
      <SafeAreaBox
        backgroundColor="primaryBackground"
        paddingHorizontal="l"
        flex={1}
      >
        <TouchableOpacityBox
          onPress={navigation.goBack}
          alignSelf="flex-end"
          justifyContent="center"
          paddingHorizontal="m"
          marginEnd="n_m"
        >
          <Close color={colors.white} height={21} width={21} />
        </TouchableOpacityBox>
        {body}
      </SafeAreaBox>
    </LedgerBurn>
  )
}

export default memo(DappLoginScreen)
