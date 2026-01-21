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
import { Transaction, VersionedTransaction } from '@solana/web3.js'
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
import {
  WalletSignBottomSheetRef,
  WalletStandardMessageTypes,
} from '../../solana/walletSignBottomSheetTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import * as Logger from '../../utils/logger'
import { BrowserNavigationProp, BrowserStackParamList } from './browserTypes'
import injectWalletStandard from './walletStandard'

type Route = RouteProp<BrowserStackParamList, 'BrowserWebViewScreen'>

type DeserializedTransaction = {
  transaction: Transaction | VersionedTransaction
  chain: string
  options: unknown
  isVersioned: boolean
}

const deserializeTransactionInputs = async (
  inputs: SolanaSignAndSendTransactionInput[],
): Promise<{
  transactions: DeserializedTransaction[]
  isVersioned: boolean
}> => {
  let isVersioned = false

  const transactions = await Promise.all(
    inputs.map(async ({ transaction, chain, options }) => {
      const tx = new Uint8Array(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.keys(transaction).map((k) => (transaction as any)[k]),
      )

      try {
        VersionedTransaction.deserialize(tx)
        isVersioned = true
      } catch {
        isVersioned = false
      }

      return {
        transaction: isVersioned
          ? VersionedTransaction.deserialize(tx)
          : Transaction.from(tx),
        chain,
        options,
        isVersioned,
      }
    }),
  )

  return { transactions, isVersioned }
}

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

  const handleConnect = useCallback(async () => {
    Logger.breadcrumb('connect')
    const decision = await walletSignBottomSheetRef.current?.show({
      type: WalletStandardMessageTypes.connect,
      url: currentUrl,
      serializedTxs: undefined,
    })

    if (!decision) {
      postMessage({ type: 'connectDeclined' })
      return
    }

    postMessage({ type: 'connectApproved' })
  }, [currentUrl, postMessage])

  const handleSignAndSendTransaction = useCallback(
    async (inputs: SolanaSignAndSendTransactionInput[]) => {
      Logger.breadcrumb('signAndSendTransaction')

      const decision = await walletSignBottomSheetRef.current?.show({
        type: WalletStandardMessageTypes.signAndSendTransaction,
        url: currentUrl,
        serializedTxs: undefined,
      })

      if (!decision) {
        postMessage({ type: 'signatureDeclined' })
        return
      }

      const { transactions, isVersioned } = await deserializeTransactionInputs(
        inputs,
      )

      const signatures = await Promise.all(
        transactions.map(async ({ transaction, options }) => {
          const signedTransaction =
            await anchorProvider?.wallet.signTransaction(
              isVersioned
                ? (transaction as VersionedTransaction)
                : (transaction as Transaction),
            )

          if (!signedTransaction || !anchorProvider) {
            throw new Error('Failed to sign transaction')
          }

          const signature = await anchorProvider.connection.sendRawTransaction(
            signedTransaction.serialize(),
            { skipPreflight: true, maxRetries: 5, ...(options as object) },
          )

          return { signature: bs58.decode(signature) }
        }),
      )

      postMessage({ type: 'transactionSigned', data: signatures })
    },
    [anchorProvider, currentUrl, postMessage],
  )

  const handleSignTransaction = useCallback(
    async (inputs: SolanaSignAndSendTransactionInput[]) => {
      Logger.breadcrumb('signTransaction')

      const { transactions, isVersioned } = await deserializeTransactionInputs(
        inputs,
      )

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
        postMessage({ type: 'signatureDeclined' })
        return
      }

      const signedTransactions: (Transaction | VersionedTransaction)[] = []
      // eslint-disable-next-line no-restricted-syntax
      for (const { transaction } of transactions) {
        const signedTransaction = await anchorProvider?.wallet.signTransaction(
          isVersioned
            ? (transaction as VersionedTransaction)
            : (transaction as Transaction),
        )
        if (!signedTransaction) {
          throw new Error('Failed to sign transaction')
        }
        signedTransactions.push(signedTransaction)
      }

      const outputs = signedTransactions.map((tx) => ({
        signedTransaction: new Uint8Array(tx.serialize()),
      }))

      postMessage({ type: 'transactionSigned', data: outputs })
    },
    [anchorProvider, currentUrl, postMessage],
  )

  const handleSignMessage = useCallback(
    async (inputs: SolanaSignMessageInput[]) => {
      Logger.breadcrumb('signMessage')

      const decision = await walletSignBottomSheetRef.current?.show({
        type: WalletStandardMessageTypes.signMessage,
        url: currentUrl,
        message: inputs
          .map(({ message }) => Buffer.from(message).toString('utf-8'))
          .join(','),
        serializedTxs: undefined,
      })

      if (!decision) {
        postMessage({ type: 'signatureDeclined' })
        return
      }

      const messages = inputs.map(({ message }) => Buffer.from(message))

      const signedMessages = await Promise.all(
        messages.map(async (message) => {
          const signature = await signMsg(message)
          return {
            signedMessage: message.toJSON().data,
            signature: signature.toJSON().data,
          }
        }),
      )

      postMessage({ type: 'messageSigned', data: signedMessages })
    },
    [currentUrl, postMessage, signMsg],
  )

  const onMessage = useCallback(
    async (msg: WebViewMessageEvent) => {
      if (
        !currentAccount?.address ||
        !currentAccount?.solanaAddress ||
        !anchorProvider ||
        !walletSignBottomSheetRef
      ) {
        return
      }

      const { type, inputs } = JSON.parse(msg.nativeEvent.data)

      switch (type) {
        case WalletStandardMessageTypes.connect:
          await handleConnect()
          break
        case WalletStandardMessageTypes.signAndSendTransaction:
          await handleSignAndSendTransaction(inputs)
          break
        case WalletStandardMessageTypes.signTransaction:
          await handleSignTransaction(inputs)
          break
        case WalletStandardMessageTypes.signMessage:
          await handleSignMessage(inputs)
          break
        default:
          Logger.breadcrumb('Unknown type', type)
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
