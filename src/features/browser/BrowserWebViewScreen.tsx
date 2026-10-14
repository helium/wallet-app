import BackArrow from '@assets/images/backArrow.svg'
import Bookmark from '@assets/images/bookmark.svg'
import BookmarkFilled from '@assets/images/bookmarkFilled.svg'
import Close from '@assets/images/close.svg'
import Refresh from '@assets/images/refresh.svg'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import {
  SolanaSignAndSendTransactionInput,
  SolanaSignMessageInput,
} from '@solana/wallet-standard-features'
import { VersionedTransaction } from '@solana/web3.js'
import { useSpacing } from '@theme/themeHooks'
import bs58 from 'bs58'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview'
import Box from '../../components/Box'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import useBrowser from '../../hooks/useBrowser'
import SolanaProvider, { useSolana } from '../../solana/SolanaProvider'
import WalletSignBottomSheet from '../../solana/WalletSignBottomSheet'
import { isTransactionMessage } from '../../solana/signing'
import {
  WalletSignBottomSheetRef,
  WalletStandardMessageTypes,
} from '../../solana/walletSignBottomSheetTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import * as Logger from '../../utils/logger'
import { isRequiredSigner } from '../../utils/solanaUtils'
import { BrowserNavigationProp, BrowserStackParamList } from './browserTypes'
import {
  deserializeTransactionInputs,
  hasUnsupportedTransaction,
  messageBytes,
  sendInSequence,
  UNSUPPORTED_VERSION_ERROR,
} from './dappTransactions'
import { runOneRequest } from './dappRequestGate'
import injectWalletStandard from './walletStandard'

type Route = RouteProp<BrowserStackParamList, 'BrowserWebViewScreen'>

type BrowserHeaderProps = {
  currentUrl: string
  onClose: () => void
}

const BrowserHeader = ({ currentUrl, onClose }: BrowserHeaderProps) => {
  const spacing = useSpacing()

  return (
    <Box
      backgroundColor="black900"
      paddingBottom="m"
      paddingStart="m"
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
    >
      <Box width={14 + spacing.m} height={14} />
      <Box flex={1}>
        <Text
          textAlign="center"
          variant="body2Medium"
          color="secondaryText"
          adjustsFontSizeToFit
        >
          {currentUrl}
        </Text>
      </Box>
      <TouchableOpacityBox onPress={onClose} paddingHorizontal="m">
        <Close color="white" width={14} height={14} />
      </TouchableOpacityBox>
    </Box>
  )
}

type BrowserFooterProps = {
  onBack: () => void
  onForward: () => void
  onFavorite: () => void
  onRefresh: () => void
  isFavorite: boolean
}

const BrowserFooter = ({
  onBack,
  onForward,
  onFavorite,
  onRefresh,
  isFavorite,
}: BrowserFooterProps) => {
  return (
    <Box padding="m" flexDirection="row" backgroundColor="black900">
      <Box flexGrow={1} alignItems="center">
        <TouchableOpacityBox onPress={onBack}>
          <BackArrow width={20} height={20} />
        </TouchableOpacityBox>
      </Box>
      <Box flexGrow={1} alignItems="center">
        <TouchableOpacityBox style={styles.rotatedArrow} onPress={onForward}>
          <BackArrow width={20} height={20} />
        </TouchableOpacityBox>
      </Box>
      <Box flexGrow={1} alignItems="center">
        <TouchableOpacityBox onPress={onFavorite}>
          {isFavorite ? (
            <BookmarkFilled color="white" width={20} height={20} />
          ) : (
            <Bookmark color="white" width={20} height={20} />
          )}
        </TouchableOpacityBox>
      </Box>
      <Box flexGrow={1} alignItems="center">
        <TouchableOpacityBox onPress={onRefresh}>
          <Refresh width={20} height={20} />
        </TouchableOpacityBox>
      </Box>
    </Box>
  )
}

export const BrowserWrapper = () => {
  return (
    <Box flex={1}>
      <SolanaProvider>
        <BrowserWebViewScreen />
      </SolanaProvider>
    </Box>
  )
}

const BrowserWebViewScreen = () => {
  const route = useRoute<Route>()
  const { uri } = route.params
  const edges = useMemo(() => ['top'] as Edge[], [])
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, signMsg } = useSolana()
  const webview = useRef<WebView | null>(null)
  const walletSignBottomSheetRef = useRef<WalletSignBottomSheetRef | null>(null)
  // True while a dApp request is open; another one is declined meanwhile
  const pendingRequestRef = useRef<boolean>(false)

  const [currentUrl, setCurrentUrl] = useState(uri)
  const accountAddress = useMemo(
    () => currentAccount?.solanaAddress,
    [currentAccount?.solanaAddress],
  )

  const navigation = useNavigation<BrowserNavigationProp>()
  const { favorites, addFavorite, removeFavorite } = useBrowser()
  const isAndroid = useMemo(() => Platform.OS === 'android', [])
  const [isScriptInjected, setIsScriptInjected] = useState(false)

  const isFavorite = useMemo(() => {
    return favorites.some((favorite) => favorite === currentUrl)
  }, [favorites, currentUrl])

  const postMessage = useCallback((message: object) => {
    webview.current?.postMessage(JSON.stringify(message))
  }, [])

  const handleConnect = useCallback(
    async (id: number) => {
      Logger.breadcrumb('connect')
      const decision = await walletSignBottomSheetRef.current?.show({
        type: WalletStandardMessageTypes.connect,
        url: currentUrl,
        serializedTxs: undefined,
      })

      if (!decision) {
        postMessage({ id, type: 'connectDeclined' })
        return
      }

      postMessage({ id, type: 'connectApproved' })
    },
    [currentUrl, postMessage],
  )

  const handleSignAndSendTransaction = useCallback(
    async (id: number, inputs: SolanaSignAndSendTransactionInput[]) => {
      Logger.breadcrumb('signAndSendTransaction')

      try {
        const { transactions } = await deserializeTransactionInputs(inputs)

        if (hasUnsupportedTransaction(transactions)) {
          postMessage({
            id,
            type: 'signatureDeclined',
            error: UNSUPPORTED_VERSION_ERROR,
          })
          return
        }

        const wallet = anchorProvider?.wallet.publicKey
        if (
          !wallet ||
          transactions.some(
            ({ transaction }) => !isRequiredSigner(transaction, wallet),
          )
        ) {
          postMessage({
            id,
            type: 'signatureDeclined',
            error: 'Wallet is not a signer of this transaction',
          })
          return
        }

        const txBuffers: Buffer[] = inputs.map(({ transaction }) =>
          Buffer.from(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.keys(transaction).map((k) => (transaction as any)[k]),
          ),
        )

        const decision = await walletSignBottomSheetRef.current?.show({
          type: WalletStandardMessageTypes.signAndSendTransaction,
          url: currentUrl,
          serializedTxs: txBuffers,
        })

        if (!decision) {
          postMessage({ id, type: 'signatureDeclined' })
          return
        }

        const signatures = await sendInSequence(
          transactions,
          async ({ transaction, options }) => {
            const signedTransaction =
              await anchorProvider?.wallet.signTransaction(transaction)

            if (!signedTransaction || !anchorProvider) {
              throw new Error('Failed to sign transaction')
            }

            return anchorProvider.connection.sendRawTransaction(
              signedTransaction.serialize(),
              { skipPreflight: true, maxRetries: 5, ...(options as object) },
            )
          },
        )

        postMessage({
          id,
          type: 'transactionSigned',
          data: signatures.map((signature) => ({
            signature: bs58.decode(signature),
          })),
        })
      } catch (e) {
        postMessage({
          id,
          type: 'signatureDeclined',
          error: (e as Error).message,
        })
      }
    },
    [anchorProvider, currentUrl, postMessage],
  )

  const handleSignTransaction = useCallback(
    async (id: number, inputs: SolanaSignAndSendTransactionInput[]) => {
      Logger.breadcrumb('signTransaction')

      try {
        const { transactions } = await deserializeTransactionInputs(inputs)

        if (hasUnsupportedTransaction(transactions)) {
          postMessage({
            id,
            type: 'signatureDeclined',
            error: UNSUPPORTED_VERSION_ERROR,
          })
          return
        }

        const wallet = anchorProvider?.wallet.publicKey
        if (
          !wallet ||
          transactions.some(
            ({ transaction }) => !isRequiredSigner(transaction, wallet),
          )
        ) {
          postMessage({
            id,
            type: 'signatureDeclined',
            error: 'Wallet is not a signer of this transaction',
          })
          return
        }

        const txBuffers: Buffer[] = inputs.map(({ transaction }) =>
          Buffer.from(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            Object.keys(transaction).map((k) => (transaction as any)[k]),
          ),
        )

        const decision = await walletSignBottomSheetRef.current?.show({
          type: WalletStandardMessageTypes.signTransaction,
          url: currentUrl,
          serializedTxs: txBuffers,
        })

        if (!decision) {
          postMessage({ id, type: 'signatureDeclined' })
          return
        }

        const signedTransactions: VersionedTransaction[] = []
        // eslint-disable-next-line no-restricted-syntax
        for (const { transaction } of transactions) {
          const signedTransaction =
            await anchorProvider?.wallet.signTransaction(transaction)
          if (!signedTransaction) {
            throw new Error('Failed to sign transaction')
          }
          signedTransactions.push(signedTransaction)
        }

        const outputs = signedTransactions.map((tx) => ({
          signedTransaction: new Uint8Array(tx.serialize()),
        }))

        postMessage({ id, type: 'transactionSigned', data: outputs })
      } catch (e) {
        postMessage({
          id,
          type: 'signatureDeclined',
          error: (e as Error).message,
        })
      }
    },
    [anchorProvider, currentUrl, postMessage],
  )

  const handleSignMessage = useCallback(
    async (id: number, inputs: SolanaSignMessageInput[]) => {
      Logger.breadcrumb('signMessage')

      const messages = inputs.map(({ message }) => messageBytes(message))

      if (messages.some(isTransactionMessage)) {
        postMessage({
          id,
          type: 'signatureDeclined',
          error: 'Refusing to sign a transaction as a message',
        })
        return
      }

      const decision = await walletSignBottomSheetRef.current?.show({
        type: WalletStandardMessageTypes.signMessage,
        url: currentUrl,
        message: messages.map((message) => message.toString('utf-8')).join(','),
        serializedTxs: undefined,
      })

      if (!decision) {
        postMessage({ id, type: 'signatureDeclined' })
        return
      }

      const signedMessages = await Promise.all(
        messages.map(async (message) => {
          const signature = await signMsg(message)
          return {
            signedMessage: message.toJSON().data,
            signature: signature.toJSON().data,
          }
        }),
      )

      postMessage({ id, type: 'messageSigned', data: signedMessages })
    },
    [currentUrl, postMessage, signMsg],
  )

  const onMessage = useCallback(
    async (msg: WebViewMessageEvent) => {
      const { id, type, inputs } = JSON.parse(msg.nativeEvent.data)

      if (
        !currentAccount?.address ||
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        !walletSignBottomSheetRef
      ) {
        // Reply so the dApp promise does not hang
        if (id && type) {
          postMessage({
            id,
            type: 'signatureDeclined',
            error: 'Wallet not ready',
          })
        }
        return
      }

      try {
        const decline = () =>
          postMessage({
            id,
            type: 'signatureDeclined',
            error: 'Request pending',
          })
        switch (type) {
          case WalletStandardMessageTypes.connect:
            await runOneRequest(pendingRequestRef, decline, () =>
              handleConnect(id),
            )
            break
          case WalletStandardMessageTypes.signAndSendTransaction:
            await runOneRequest(pendingRequestRef, decline, () =>
              handleSignAndSendTransaction(id, inputs),
            )
            break
          case WalletStandardMessageTypes.signTransaction:
            await runOneRequest(pendingRequestRef, decline, () =>
              handleSignTransaction(id, inputs),
            )
            break
          case WalletStandardMessageTypes.signMessage:
            await runOneRequest(pendingRequestRef, decline, () =>
              handleSignMessage(id, inputs),
            )
            break
          default:
            Logger.breadcrumb('Unknown type', type)
        }
      } catch (e) {
        Logger.error(e)
        if (
          type === WalletStandardMessageTypes.signAndSendTransaction ||
          type === WalletStandardMessageTypes.signTransaction ||
          type === WalletStandardMessageTypes.signMessage
        ) {
          postMessage({ id, type: 'signatureDeclined' })
        }
      }
    },
    [
      anchorProvider,
      currentAccount?.address,
      currentAccount?.solanaAddress,
      handleConnect,
      handleSignAndSendTransaction,
      handleSignTransaction,
      handleSignMessage,
      postMessage,
    ],
  )

  const injectedJavascript = useCallback(() => {
    if (isScriptInjected) return ''

    return `
    ${injectWalletStandard.toString()}

    // noinspection JSIgnoredPromiseFromCall
    injectWalletStandard("${accountAddress}", [${
      accountAddress && bs58.decode(accountAddress)
    }], ${isAndroid});
    true;
    `
  }, [accountAddress, isAndroid, isScriptInjected])

  const injectModule = useCallback(() => {
    if (!webview?.current || isScriptInjected) return
    setIsScriptInjected(true)

    const injectionScript = `
      (function() {
        function injectWhenReady() {
          ${injectedJavascript()}
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', injectWhenReady);
        } else {
          injectWhenReady();
        }
      })();
    `

    webview.current.injectJavaScript(injectionScript)
  }, [injectedJavascript, isScriptInjected])

  const onLoadStart = useCallback(() => {
    setIsScriptInjected(false)
  }, [])

  const onLoadEnd = useCallback(() => {
    if (!isScriptInjected) {
      injectModule()
    }
  }, [isScriptInjected, injectModule])

  const onRefresh = useCallback(() => {
    setIsScriptInjected(false)
    webview.current?.reload()
  }, [])

  const onNavigationChange = useCallback((event: WebViewNavigation) => {
    const baseUrl = event.url.replace('https://', '').split('/')
    setCurrentUrl(baseUrl[0])
  }, [])

  const closeModal = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const onBack = useCallback(() => {
    webview.current?.goBack()
  }, [])

  const onForward = useCallback(() => {
    webview.current?.goForward()
  }, [])

  const onFavorite = useCallback(() => {
    if (isFavorite) {
      removeFavorite(currentUrl)
    } else {
      addFavorite(currentUrl)
    }
  }, [addFavorite, removeFavorite, isFavorite, currentUrl])

  return (
    <SafeAreaBox flex={1} edges={edges} backgroundColor="black900">
      <WalletSignBottomSheet ref={walletSignBottomSheetRef} onClose={() => {}}>
        <BrowserHeader currentUrl={currentUrl} onClose={closeModal} />
        <WebView
          ref={webview}
          originWhitelist={['*']}
          javaScriptEnabled
          onLoadStart={onLoadStart}
          injectedJavaScriptBeforeContentLoaded={injectedJavascript()}
          onLoadEnd={isAndroid ? undefined : onLoadEnd}
          onNavigationStateChange={onNavigationChange}
          onMessage={onMessage}
          source={{ uri }}
          onShouldStartLoadWithRequest={(event) => {
            return !event.url.startsWith('solana-wallet:')
          }}
        />
        <BrowserFooter
          onBack={onBack}
          onForward={onForward}
          onFavorite={onFavorite}
          onRefresh={onRefresh}
          isFavorite={isFavorite}
        />
      </WalletSignBottomSheet>
    </SafeAreaBox>
  )
}

export default BrowserWebViewScreen

const styles = StyleSheet.create({
  rotatedArrow: {
    transform: [{ rotate: '180deg' }],
  },
})
