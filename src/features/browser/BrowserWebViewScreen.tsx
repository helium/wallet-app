import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import {
  SolanaSignAndSendTransactionInput,
  SolanaSignMessageInput,
} from '@solana/wallet-standard-features'
import { VersionedTransaction } from '@solana/web3.js'
import { FocusAwareStatusBar } from '@ui/FocusAwareStatusBar'
import { PressableScale } from '@ui/PressableScale'
import { Text } from '@ui/Text'
import bs58 from 'bs58'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react-native'
import React, { useRef, useState } from 'react'
import { Platform, View } from 'react-native'
import { Edge } from 'react-native-safe-area-context'
import { TabSafeAreaView } from '@ui/TabSafeAreaView'
import { withUniwind } from 'uniwind'
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview'
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
import { DappOrigin, senderOrigin } from './dappMessageOrigin'
import injectWalletStandard from './walletStandard'

const SafeArea = withUniwind(TabSafeAreaView)
const BackIcon = withUniwind(ChevronLeft)
const ForwardIcon = withUniwind(ChevronRight)
// Lucide strokes the outline; a favorite also fills it
const BookmarkIcon = withUniwind(Bookmark, {
  color: { fromClassName: 'colorClassName', styleProperty: 'accentColor' },
  fill: { fromClassName: 'fillClassName', styleProperty: 'accentColor' },
})
const CloseIcon = withUniwind(X)
const RefreshIcon = withUniwind(RefreshCw)

const EDGES: Edge[] = ['top', 'bottom']

type Route = RouteProp<BrowserStackParamList, 'BrowserWebViewScreen'>

type BrowserHeaderProps = {
  currentUrl: string
  onClose: () => void
}

const BrowserHeader = ({ currentUrl, onClose }: BrowserHeaderProps) => {
  return (
    <View className="flex-row items-center justify-center bg-primary ps-4 pb-4">
      <View className="h-3.5 w-[30px]" />
      <View className="flex-1">
        <Text
          className="text-center font-medium text-muted-foreground"
          adjustsFontSizeToFit
        >
          {currentUrl}
        </Text>
      </View>
      <PressableScale feedback="opacity" onPress={onClose} className="px-4">
        <CloseIcon size={14} colorClassName="accent-primary-foreground" />
      </PressableScale>
    </View>
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
    <View className="flex-row bg-primary p-4">
      <View className="grow items-center">
        <PressableScale feedback="opacity" onPress={onBack}>
          <BackIcon size={20} colorClassName="accent-primary-foreground" />
        </PressableScale>
      </View>
      <View className="grow items-center">
        <PressableScale feedback="opacity" onPress={onForward}>
          <ForwardIcon size={20} colorClassName="accent-primary-foreground" />
        </PressableScale>
      </View>
      <View className="grow items-center">
        <PressableScale feedback="opacity" onPress={onFavorite}>
          <BookmarkIcon
            size={20}
            colorClassName="accent-primary-foreground"
            fillClassName={isFavorite ? 'accent-primary-foreground' : undefined}
          />
        </PressableScale>
      </View>
      <View className="grow items-center">
        <PressableScale feedback="opacity" onPress={onRefresh}>
          <RefreshIcon size={20} colorClassName="accent-primary-foreground" />
        </PressableScale>
      </View>
    </View>
  )
}

export const BrowserWrapper = () => {
  return (
    <View className="flex-1">
      <SolanaProvider>
        <BrowserWebViewScreen />
      </SolanaProvider>
    </View>
  )
}

const BrowserWebViewScreen = () => {
  const route = useRoute<Route>()
  const { uri } = route.params
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, signMsg } = useSolana()
  const webview = useRef<WebView | null>(null)
  const walletSignBottomSheetRef = useRef<WalletSignBottomSheetRef | null>(null)
  // True while a dApp request is open; another one is declined meanwhile
  const pendingRequestRef = useRef<boolean>(false)

  const [currentUrl, setCurrentUrl] = useState(uri)
  const accountAddress = currentAccount?.solanaAddress

  const navigation = useNavigation<BrowserNavigationProp>()
  const { favorites, addFavorite, removeFavorite } = useBrowser()
  const isAndroid = Platform.OS === 'android'
  const [isScriptInjected, setIsScriptInjected] = useState(false)

  const isFavorite = favorites.some((favorite) => favorite === currentUrl)

  const postMessage = (message: object) => {
    webview.current?.postMessage(JSON.stringify(message))
  }

  const handleConnect = async (id: number, origin: DappOrigin) => {
    Logger.breadcrumb('connect')
    const decision = await walletSignBottomSheetRef.current?.show({
      type: WalletStandardMessageTypes.connect,
      url: origin,
      serializedTxs: undefined,
    })

    if (!decision) {
      postMessage({ id, type: 'connectDeclined' })
      return
    }

    postMessage({ id, type: 'connectApproved' })
  }

  const handleSignAndSendTransaction = async (
    id: number,
    origin: DappOrigin,
    inputs: SolanaSignAndSendTransactionInput[],
  ) => {
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
        url: origin,
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
  }

  const handleSignTransaction = async (
    id: number,
    origin: DappOrigin,
    inputs: SolanaSignAndSendTransactionInput[],
  ) => {
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
        url: origin,
        serializedTxs: txBuffers,
      })

      if (!decision) {
        postMessage({ id, type: 'signatureDeclined' })
        return
      }

      const signedTransactions: VersionedTransaction[] = []
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
  }

  const handleSignMessage = async (
    id: number,
    origin: DappOrigin,
    inputs: SolanaSignMessageInput[],
  ) => {
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
      url: origin,
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
  }

  const onMessage = async (msg: WebViewMessageEvent) => {
    const origin = senderOrigin(msg.nativeEvent.url)
    // No reply: the frame picked the id, and a decline could end the top
    // page's pending request with the same id
    if (!origin) {
      Logger.breadcrumb('Dropped message from an opaque origin')
      return
    }

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
            handleConnect(id, origin),
          )
          break
        case WalletStandardMessageTypes.signAndSendTransaction:
          await runOneRequest(pendingRequestRef, decline, () =>
            handleSignAndSendTransaction(id, origin, inputs),
          )
          break
        case WalletStandardMessageTypes.signTransaction:
          await runOneRequest(pendingRequestRef, decline, () =>
            handleSignTransaction(id, origin, inputs),
          )
          break
        case WalletStandardMessageTypes.signMessage:
          await runOneRequest(pendingRequestRef, decline, () =>
            handleSignMessage(id, origin, inputs),
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
  }

  const injectedJavascript = () => {
    if (isScriptInjected) return ''

    return `
    ${injectWalletStandard.toString()}

    // noinspection JSIgnoredPromiseFromCall
    injectWalletStandard("${accountAddress}", [${
      accountAddress && bs58.decode(accountAddress)
    }], ${isAndroid});
    true;
    `
  }

  const injectModule = () => {
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
  }

  const onLoadStart = () => {
    setIsScriptInjected(false)
  }

  const onLoadEnd = () => {
    if (!isScriptInjected) {
      injectModule()
    }
  }

  const onRefresh = () => {
    setIsScriptInjected(false)
    webview.current?.reload()
  }

  const onNavigationChange = (event: WebViewNavigation) => {
    const baseUrl = event.url.replace('https://', '').split('/')
    setCurrentUrl(baseUrl[0])
  }

  const closeModal = () => {
    navigation.goBack()
  }

  const onBack = () => {
    webview.current?.goBack()
  }

  const onForward = () => {
    webview.current?.goForward()
  }

  const onFavorite = () => {
    if (isFavorite) {
      removeFavorite(currentUrl)
    } else {
      addFavorite(currentUrl)
    }
  }

  return (
    <SafeArea className="flex-1 bg-primary" edges={EDGES}>
      <FocusAwareStatusBar barStyle="light-content" />
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
          onMessage={(msg) => void onMessage(msg).catch(console.error)}
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
    </SafeArea>
  )
}

export default BrowserWebViewScreen
