import { TokenBurnV1 } from '@helium/transactions'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { memo, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking } from 'react-native'
import { useDebouncedCallback } from 'use-debounce/lib'
import Close from '@assets/images/close.svg'
import { useAsync } from 'react-async-hook'
import LedgerBurnModal, {
  LedgerBurnModalRef,
} from '../../components/LedgerBurnModal'
import { encodeMemoString } from '../../components/MemoInput'
import SafeAreaBox from '../../components/SafeAreaBox'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import {
  EMPTY_B58_ADDRESS,
  useTransactions,
} from '../../storage/TransactionProvider'
import { useColors } from '../../theme/themeHooks'
import useAlert from '../../hooks/useAlert'
import useDisappear from '../../hooks/useDisappear'
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
  const { makeBurnTxn } = useTransactions()
  const { primaryText } = useColors()
  const { showOKAlert } = useAlert()
  const ledgerRef = useRef<LedgerBurnModalRef>(null)
  const hasRequestedPair = useRef(false)
  const ledgerShown = useRef(false)

  useAsync(async () => {
    if (params.uri.includes('wc:') && !hasRequestedPair.current) {
      hasRequestedPair.current = true
      try {
        await pairClient(params.uri)
      } catch (error) {
        showOKAlert({
          title: t('dappLogin.error', {
            app: sessionProposal?.params.proposer.metadata.name,
          }),
          message: (error as Error).toString(),
        })
      }
    }
  }, [pairClient, params.callback, params.uri])

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }, [navigation])

  useDisappear(() => {
    goBack()
    disconnect()
  })

  const handleDeny = useCallback(async () => {
    await denyPair()
    goBack()
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
      showOKAlert({
        title: t('dappLogin.error', {
          app: sessionProposal?.params.proposer.metadata.name,
        }),
        message: (error as Error).toString(),
      })
    }
  }, [approvePair, currentAccount, sessionProposal, showOKAlert, t])

  useAsync(async () => {
    if (!currentAccount?.address || !loginRequest) return

    const isLedger = !!currentAccount.ledgerDevice

    const { signedTxn, unsignedTxn, txnJson } = await makeBurnTxn({
      payeeB58: EMPTY_B58_ADDRESS.b58,
      amount: 1,
      memo: encodeMemoString('test') || '',
      nonce: 0,
      shouldSign: !isLedger,
    })

    if (isLedger && currentAccount.ledgerDevice) {
      if (ledgerShown.current) return

      ledgerShown.current = true

      ledgerRef.current?.show({
        unsignedTxn,
        ledgerDevice: currentAccount.ledgerDevice,
        accountIndex: currentAccount.accountIndex || 0,
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
          app: sessionProposal?.params.proposer.metadata.name,
        }),
        message: (error as Error).toString(),
      })
    }

    goBack()

    if (params.callback && (await Linking.canOpenURL(params.callback))) {
      Linking.openURL(params.callback)
    }
  }, [currentAccount, loginRequest])

  const ledgerConfirmed = useCallback(
    async ({ txn: signedTxn }: { txn: TokenBurnV1; txnJson: string }) => {
      if (!currentAccount) return

      login({
        txn: signedTxn.toString(),
        address: currentAccount.address,
      })

      goBack()
    },
    [currentAccount, goBack, login],
  )

  const handleLedgerError = useCallback(
    async (error: Error) => {
      await showOKAlert({
        title: t('generic.error'),
        message: error.toString(),
      })
      goBack()
    },
    [goBack, showOKAlert, t],
  )

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
    <LedgerBurnModal
      ref={ledgerRef}
      onConfirm={ledgerConfirmed}
      onError={handleLedgerError}
      title={t('dappLogin.ledger.title')}
      subtitle={t('dappLogin.ledger.subtitle', {
        name: currentAccount?.ledgerDevice?.name,
        app: sessionProposal?.params.proposer.metadata.name,
      })}
    >
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
    </LedgerBurnModal>
  )
}

export default memo(DappLoginScreen)
