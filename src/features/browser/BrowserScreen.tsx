import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Edge } from 'react-native-safe-area-context'
import { WebView } from 'react-native-webview'
import { PublicKey } from '@solana/web3.js'
// import { initialize } from '@helium/wallet-standard'
import { Asset } from 'expo-asset'
import { useAsync } from 'react-async-hook'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'

const BrowserScreen = () => {
  const edges = useMemo(() => ['top'] as Edge[], [])
  const { currentAccount } = useAccountStorage()
  const webview = useRef<WebView>()
  const [jsUri, setUri] = useState<string | undefined>()
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

  const onMessage = useCallback((msg) => {
    console.log('msg', msg.nativeEvent.data)

    const { data } = msg.nativeEvent

    switch (data.type) {
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
        break
      case 'signAllTransactions':
        console.log('signAllTransactions')
        break
      case 'signMessage':
        console.log('signMessage')
        break
      default:
        console.log('default')
    }
  }, [])

  // Call initialize(heliumWallet) in injected javascrip
  const injectModule = useCallback(() => {
    if (!webview?.current) return

    const script = `
    var wallet = {
      publicKey: 'publicKey',
      connect: () =>
        new Promise(() => {
          return { publicKey: 'publicKey' }
        }),
      disconnect: async () => {
        console.log('disconnect')
      },
      signAndSendTransaction: async (transaction) => {
        console.log('transaction', transaction)
        return { signature: 'signature' }
      },  
      signTransaction: async (transaction) => {
        console.log('transaction', transaction)
        return { signature: 'signature' }
      },
      signAllTransactions: async (transactions) => {
        console.log('transactions', transactions)
        return transactions
      },
      signMessage: async (message) => {
        console.log('message', message)
        const uint8Arr = new Uint8Array(message)
        return { signature: uint8Arr }
      },
      on: () => {},
      off: () => {},
    };

    window.heliumWallet = wallet;

    // Attach the reference to the window, guarding against errors.
    try {
        Object.defineProperty(window, 'heliumWallet', { value: heliumWallet });
    }
    catch (error) {
        console.error(error);
    }

    window.addEventListener('message', function (event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({"type": "connect"}));

      if (event.data.type === 'channel-solana-rpc-request') {
        console.log('solana:connect')
        window.ReactNativeWebView.postMessage(JSON.stringify({"type": "channel-solana-rpc-request"}));
      }
    });

    window.ReactNativeWebView.postMessage(JSON.stringify({"hi": "${currentAccount?.solanaAddress}", "wallet": JSON.stringify(wallet), "path": window.location.pathname}));

    true;
    `

    webview.current.injectJavaScript(script)
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
          onLoad={injectModule}
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
