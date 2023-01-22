/* eslint-disable no-case-declarations */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Edge } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import '@expo/browser-polyfill'
// import 'events-polyfill'
import { PublicKey, Transaction } from '@solana/web3.js'
import { initialize } from '@helium/wallet-standard/dist'
import { Asset } from 'expo-asset'
import { useAsync } from 'react-async-hook'
import bs58 from 'bs58'
import util from 'util'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import useAlert from '../../hooks/useAlert'
import injectWalletStandard from './walletStandard'

const BrowserScreen = () => {
  const edges = useMemo(() => ['top'] as Edge[], [])
  const { currentAccount, anchorProvider } = useAccountStorage()
  const webview = useRef<WebView>()
  const [jsUri, setUri] = useState<string | undefined>()
  const [jsInjected, setJsInjected] = useState(false)
  const { showOKCancelAlert } = useAlert()

  useEffect(() => {
    if (!currentAccount?.solanaAddress) return

    const publicKey = new PublicKey(currentAccount.solanaAddress)

    const disconnect = async () => {
      console.log('disconnect')
    }

    const signAndSendTransaction = async (transaction: any) => {
      console.log('transaction', transaction)
      return { signature: 'signature' }
    }

    const signTransaction = async (transaction: any) => {
      console.log('transaction', transaction)
      return { signature: 'signature' }
    }

    const signAllTransactions = async (transactions: any) => {
      console.log('transactions', transactions)
      return transactions
    }

    const signMessage = async (message: any) => {
      console.log('message', message)
      const uint8Arr = new Uint8Array(message)
      return { signature: uint8Arr }
    }

    // Dummy Wallet API
    const heliumWallet = {
      publicKey,
      connect: () =>
        new Promise<{ publicKey: PublicKey }>(() => {
          return { publicKey }
        }),
      disconnect,
      signAndSendTransaction,
      signTransaction,
      signAllTransactions,
      signMessage,
      on: () => {},
      off: () => {},
    }

    // initialize(heliumWallet)
  }, [currentAccount])

  const onMessage = useCallback(
    async (msg) => {
      console.log('msg', msg.nativeEvent.data)

      const { data } = msg.nativeEvent

      console.log(util.inspect(data, false, null, true /* enable colors */))

      const parsedData = JSON.parse(data)

      switch (parsedData.type) {
        case 'connect':
          console.log('solana:connect')
          break
        case 'disconnect':
          console.log('disconnect')
          break
        case 'signAndSendTransaction':
          console.log('signAndSendTransaction')
          break
        case 'signTransaction':
          console.log('signTransaction')
          const decision = await showOKCancelAlert({
            title: 'Sign Transaction?',
            message: 'Are you sure you want to sign this transaction?',
          })
          if (!decision) {
            // Signature declined
            webview.current?.postMessage(
              JSON.stringify({
                type: 'signatureDeclined',
              }),
            )
            return
          }

          console.log('parsedData.inputs', parsedData.inputs)
          const outputs: { signedTransaction: Uint8Array }[] = []

          // Converting int array objects to Uint8Array
          const transactions = parsedData.inputs.map(({ transaction }) =>
            Transaction.from(
              Object.keys(transaction).map(
                (k) => parsedData.inputs[0].transaction[k],
              ),
            ),
          )
          console.log('transactions', transactions)
          const signedTransactions =
            await anchorProvider?.wallet.signAllTransactions(transactions)

          console.log('signedTransactions', signedTransactions)

          if (!signedTransactions) {
            // TODO: Handle this
            return
          }

          outputs.push(
            ...signedTransactions.map((signedTransaction) => {
              return {
                signedTransaction: new Uint8Array(
                  signedTransaction.serialize(),
                ),
              }
            }),
          )

          webview.current?.postMessage(
            JSON.stringify({
              type: 'transactionSigned',
              data: outputs,
            }),
          )
          break
        case 'signAllTransactions':
          console.log('signAllTransactions')
          break
        case 'signMessage':
          console.log('signMessage')
          break
        case 'app-ready':
          console.log('app-ready')
        default:
          console.log('default')
      }
    },
    [anchorProvider.wallet, showOKCancelAlert],
  )

  // Call initialize(heliumWallet) in injected javascript
  const injectModule = useCallback(() => {
    if (!webview?.current || !currentAccount?.solanaAddress) return

    const script = `
    ${injectWalletStandard.toString()}

    // noinspection JSIgnoredPromiseFromCall
    injectWalletStandard("${currentAccount.solanaAddress}", [${bs58.decode(
      currentAccount.solanaAddress,
    )}]);
    true;
    `

    webview.current.injectJavaScript(script)
    setJsInjected(true)
  }, [currentAccount])

  useAsync(async () => {
    const { uri } = Asset.fromModule('../wallet-standard/index.js')
    setUri(uri)
  }, [])

  return (
    <SafeAreaBox flex={1} edges={edges}>
      {jsUri && (
        <WebView
          ref={webview}
          javaScriptEnabled
          onLoad={!jsInjected ? injectModule : undefined}
          onMessage={onMessage}
          source={{
            uri: 'https://solana-labs.github.io/wallet-adapter/example/',
          }}
        />
      )}
    </SafeAreaBox>
  )
}

export default BrowserScreen
