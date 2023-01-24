import React, { Ref, useCallback, useMemo, useRef, useState } from 'react'
import { Edge } from 'react-native-safe-area-context'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import nacl from 'tweetnacl'
import { Cluster, PublicKey, Transaction } from '@solana/web3.js'
import bs58 from 'bs58'
import {
  SolanaSignMessageInput,
  SolanaSignAndSendTransactionInput,
  SolanaSignTransactionInput,
} from '@solana/wallet-standard-features'
import SafeAreaBox from '../../components/SafeAreaBox'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import useAlert from '../../hooks/useAlert'
import injectWalletStandard from './walletStandard'
import { getKeypair } from '../../storage/secureStorage'
import { getConnection } from '../../utils/solanaUtils'
import * as Logger from '../../utils/logger'
import WalletSignBottomSheet, {
  WalletSignBottomSheetRef,
} from './WalletSignBottomSheet'

const BrowserScreen = () => {
  const edges = useMemo(() => ['top'] as Edge[], [])
  const { currentAccount, anchorProvider } = useAccountStorage()
  const webview = useRef<WebView | null>(null)
  const [jsInjected, setJsInjected] = useState(false)
  const { showOKCancelAlert } = useAlert()
  const walletSignBottomSheetRef = useRef<WalletSignBottomSheetRef>()

  const onMessage = useCallback(
    async (msg: WebViewMessageEvent) => {
      if (!currentAccount?.address || !currentAccount?.solanaAddress) {
        return
      }
      // Prevents React from resetting its properties:
      msg.persist()
      const { data } = msg.nativeEvent

      const secureAcct = await getKeypair(currentAccount?.address)
      const payer = new PublicKey(currentAccount?.solanaAddress)

      if (!secureAcct) {
        throw new Error('Secure account not found')
      }

      const signer = {
        publicKey: payer,
        secretKey: secureAcct.privateKey,
      }

      const { type, inputs } = JSON.parse(data)

      if (type === 'signAndSendTransaction') {
        Logger.breadcrumb('signAndSendTransaction')
        const decision = await showOKCancelAlert({
          title: 'Sign and send transaction?',
          message: 'Are you sure you want to sign and send this transaction?',
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

        // Converting int array objects to Uint8Array
        const transactions = inputs.map(
          ({
            transaction,
            chain,
            options,
          }: SolanaSignAndSendTransactionInput) => {
            const tx = new Uint8Array(
              Object.keys(transaction).map((k) => inputs[0].transaction[k]),
            )
            return { transaction: Transaction.from(tx), chain, options }
          },
        )

        const signatures = await Promise.all(
          transactions.map(
            async ({
              transaction,
              chain,
              options,
            }: SolanaSignAndSendTransactionInput & {
              transaction: Transaction
            }) => {
              const signedTransaction =
                await anchorProvider?.wallet.signTransaction(transaction)

              if (!signedTransaction) {
                throw new Error('Failed to sign transaction')
              }

              // Remove the 'solana:' prefix
              const conn = getConnection(chain.slice(7) as Cluster)

              const signature = await conn.sendRawTransaction(
                signedTransaction.serialize(),
                {
                  skipPreflight: true,
                  maxRetries: 5,
                  ...options,
                },
              )

              // Return signature as int8array
              return { signature: bs58.decode(signature) }
            },
          ),
        )
        webview.current?.postMessage(
          JSON.stringify({
            type: 'transactionSigned',
            data: signatures,
          }),
        )
      } else if (type === 'signTransaction') {
        Logger.breadcrumb('signTransaction')
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

        const outputs: { signedTransaction: Uint8Array }[] = []

        // Converting int array objects to Uint8Array
        const transactions = inputs.map(
          ({ transaction }: SolanaSignTransactionInput) =>
            Transaction.from(
              Object.keys(transaction).map((k) => inputs[0].transaction[k]),
            ),
        )

        const signedTransactions =
          await anchorProvider?.wallet.signAllTransactions(transactions)

        if (!signedTransactions) {
          // TODO: Handle this
          return
        }

        outputs.push(
          ...signedTransactions.map((signedTransaction) => {
            return {
              signedTransaction: new Uint8Array(signedTransaction.serialize()),
            }
          }),
        )

        webview.current?.postMessage(
          JSON.stringify({
            type: 'transactionSigned',
            data: outputs,
          }),
        )
      } else if (type === 'signMessage') {
        Logger.breadcrumb('signMessage')
        // const decision = await showOKCancelAlert({
        //   title: 'Sign Message?',
        //   message: 'Are you sure you want to sign this message?',
        // })
        const decision = await walletSignBottomSheetRef.current?.show()

        if (!decision) {
          // Signature declined
          webview.current?.postMessage(
            JSON.stringify({
              type: 'signatureDeclined',
            }),
          )
          return
        }

        // Converting int array objects to Uint8Array
        const messages: Uint8Array[] = inputs.map(
          ({ message }: SolanaSignMessageInput) =>
            new Uint8Array(
              Object.keys(message).map((k) => inputs[0].message[k]),
            ),
        )

        // Sign each message using nacl and return the signature
        const signedMessages = messages.map((message) => {
          const signedMessage = nacl.sign.detached(message, signer.secretKey)
          return {
            signedMessage,
            signature: signedMessage,
          }
        })

        webview.current?.postMessage(
          JSON.stringify({
            type: 'messageSigned',
            data: signedMessages,
          }),
        )
      } else {
        Logger.breadcrumb('Unknown type', type)
      }
    },
    [anchorProvider, currentAccount, showOKCancelAlert],
  )

  // Inject wallet standard into the webview
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

  return (
    <WalletSignBottomSheet ref={walletSignBottomSheetRef} onClose={() => {}}>
      <SafeAreaBox flex={1} edges={edges}>
        <WebView
          ref={webview}
          javaScriptEnabled
          onLoad={!jsInjected ? injectModule : undefined}
          onMessage={onMessage}
          source={{
            uri: 'https://solana-labs.github.io/wallet-adapter/example/',
          }}
        />
      </SafeAreaBox>
    </WalletSignBottomSheet>
  )
}

export default BrowserScreen
