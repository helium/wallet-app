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
import { Edge, useSafeAreaInsets } from 'react-native-safe-area-context'
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
  const edges = useMemo(() => ['top', 'bottom'] as Edge[], [])
  const { currentAccount } = useAccountStorage()
  const { anchorProvider, signMsg } = useSolana()
  const webview = useRef<WebView | null>(null)
  const walletSignBottomSheetRef = useRef<WalletSignBottomSheetRef | null>(null)

  const [currentUrl, setCurrentUrl] = useState(uri)
  const accountAddress = useMemo(
    () => currentAccount?.solanaAddress,
    [currentAccount?.solanaAddress],
  )
  const { top, bottom } = useSafeAreaInsets()
  const navigation = useNavigation<BrowserNavigationProp>()
  const { favorites, addFavorite, removeFavorite } = useBrowser()
  const isAndroid = useMemo(() => Platform.OS === 'android', [])
  const spacing = useSpacing()

  const isFavorite = useMemo(() => {
    return favorites.some((favorite) => favorite === currentUrl)
  }, [favorites, currentUrl])

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

      const { data } = msg.nativeEvent

      const { type, inputs } = JSON.parse(data)

      if (type === WalletStandardMessageTypes.connect) {
        Logger.breadcrumb('connect')
        const decision = await walletSignBottomSheetRef.current?.show({
          type,
          url: currentUrl,
          serializedTxs: undefined,
        })

        if (!decision) {
          // Signature declined
          webview.current?.postMessage(
            JSON.stringify({
              type: 'connectDeclined',
            }),
          )
          return
        }

        webview.current?.postMessage(
          JSON.stringify({
            type: 'connectApproved',
          }),
        )
      } else if (type === WalletStandardMessageTypes.signAndSendTransaction) {
        Logger.breadcrumb('signAndSendTransaction')
        const decision = await walletSignBottomSheetRef?.current?.show({
          type,
          url: currentUrl,
          serializedTxs: undefined,
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

        let isVersionedTransaction = false

        // Converting int array objects to Uint8Array
        const transactions = await Promise.all(
          inputs.map(
            async ({
              transaction,
              chain,
              options,
            }: SolanaSignAndSendTransactionInput) => {
              const tx = new Uint8Array(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Object.keys(transaction).map((k) => (transaction as any)[k]),
              )
              try {
                const versionedTx = VersionedTransaction.deserialize(tx)
                isVersionedTransaction = !!versionedTx
              } catch (e) {
                isVersionedTransaction = false
              }

              return {
                transaction: isVersionedTransaction
                  ? VersionedTransaction.deserialize(tx)
                  : Transaction.from(tx),
                chain,
                options,
              }
            },
          ),
        )

        const signatures = await Promise.all(
          transactions.map(
            async ({
              transaction,
              options,
            }: SolanaSignAndSendTransactionInput & {
              transaction: Transaction | VersionedTransaction
            }) => {
              let signedTransaction:
                | Transaction
                | VersionedTransaction
                | undefined
              if (!isVersionedTransaction) {
                // TODO: Verify when lookup table is needed
                // transaction.add(lookupTableAddress)
                signedTransaction =
                  await anchorProvider?.wallet.signTransaction(
                    transaction as Transaction,
                  )
              } else {
                signedTransaction =
                  await anchorProvider?.wallet.signTransaction(
                    transaction as VersionedTransaction,
                  )
              }

              if (!signedTransaction) {
                throw new Error('Failed to sign transaction')
              }

              const conn = anchorProvider.connection

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
      } else if (type === WalletStandardMessageTypes.signTransaction) {
        Logger.breadcrumb('signTransaction')
        const outputs: { signedTransaction: Uint8Array }[] = []

        let isVersionedTransaction = false

        // Converting int array objects to Uint8Array
        const transactions = await Promise.all(
          inputs.map(
            async ({
              transaction,
              chain,
              options,
            }: SolanaSignAndSendTransactionInput) => {
              const tx = new Uint8Array(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                Object.keys(transaction).map((k) => (transaction as any)[k]),
              )
              try {
                const versionedTx = VersionedTransaction.deserialize(tx)
                isVersionedTransaction = !!versionedTx
              } catch (e) {
                isVersionedTransaction = false
              }

              return {
                transaction: isVersionedTransaction
                  ? VersionedTransaction.deserialize(tx)
                  : Transaction.from(tx),
                chain,
                options,
              }
            },
          ),
        )

        const txBuffers: Buffer[] = inputs.map(
          ({ transaction }: SolanaSignAndSendTransactionInput) =>
            new Uint8Array(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              Object.keys(transaction).map((k) => (transaction as any)[k]),
            ),
        )

        const decision = await walletSignBottomSheetRef.current?.show({
          type,
          url: currentUrl,
          serializedTxs: txBuffers,
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

        const signedTransactions = await Promise.all(
          transactions.map(
            async ({
              transaction,
            }: SolanaSignAndSendTransactionInput & {
              transaction: Transaction | VersionedTransaction
            }) => {
              let signedTransaction:
                | Transaction
                | VersionedTransaction
                | undefined
              if (!isVersionedTransaction) {
                // TODO: Verify when lookup table is needed
                // transaction.add(lookupTableAddress)
                signedTransaction =
                  await anchorProvider?.wallet.signTransaction(
                    transaction as Transaction,
                  )
              } else {
                signedTransaction =
                  await anchorProvider?.wallet.signTransaction(
                    transaction as VersionedTransaction,
                  )
              }

              if (!signedTransaction) {
                throw new Error('Failed to sign transaction')
              }

              return signedTransaction
            },
          ),
        )

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
      } else if (type === WalletStandardMessageTypes.signMessage) {
        Logger.breadcrumb('signMessage')
        const decision = await walletSignBottomSheetRef.current?.show({
          type,
          url: currentUrl,
          serializedTxs: undefined,
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
        const messages: Uint8Array[] = inputs.map(
          ({ message }: SolanaSignMessageInput) =>
            new Uint8Array(
              Object.keys(message).map((k) => inputs[0].message[k]),
            ),
        )

        // Sign each message using nacl and return the signature
        const signedMessages = await Promise.all(
          messages.map(async (message) => {
            const signedMessage = await signMsg(Buffer.from(message))
            return {
              signedMessage,
              signature: signedMessage,
            }
          }),
        )

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
    [
      anchorProvider,
      currentAccount?.address,
      currentAccount?.solanaAddress,
      currentUrl,
      signMsg,
    ],
  )

  const injectedJavascript = useCallback(() => {
    const script = `
    ${injectWalletStandard.toString()}

    // noinspection JSIgnoredPromiseFromCall
    injectWalletStandard("${accountAddress}", [${
      accountAddress && bs58.decode(accountAddress)
    }], ${isAndroid});
    true;
    `

    return script
  }, [accountAddress, isAndroid])

  // Inject wallet standard into the webview
  const injectModule = useCallback(() => {
    if (!webview?.current) return

    const script = injectedJavascript()
    webview?.current?.injectJavaScript(script)
  }, [injectedJavascript])

  const onNavigationChange = useCallback((event: WebViewNavigation) => {
    const baseUrl = event.url.replace('https://', '').split('/')
    setCurrentUrl(baseUrl[0])
  }, [])

  const closeModal = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const BrowserHeader = useCallback(() => {
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
        <TouchableOpacityBox onPress={closeModal} paddingHorizontal="m">
          <Close color="white" width={14} height={14} />
        </TouchableOpacityBox>
      </Box>
    )
  }, [currentUrl, closeModal, spacing])

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

  const onRefresh = useCallback(() => {
    webview.current?.injectJavaScript('')
    webview.current?.reload()
    injectModule()
  }, [injectModule])

  const BrowserFooter = useCallback(() => {
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
  }, [onBack, onForward, isFavorite, onFavorite, onRefresh])

  return (
    <Box position="absolute" top={0} left={0} right={0} bottom={0}>
      <WalletSignBottomSheet ref={walletSignBottomSheetRef} onClose={() => {}}>
        <Box
          backgroundColor="black900"
          height={top}
          position="absolute"
          top={0}
          left={0}
          right={0}
        />
        <SafeAreaBox flex={1} edges={edges}>
          <BrowserHeader />
          <WebView
            ref={webview}
            originWhitelist={['*']}
            javaScriptEnabled
            injectedJavaScript={injectedJavascript()}
            onNavigationStateChange={onNavigationChange}
            onMessage={onMessage}
            source={{
              uri,
            }}
            onShouldStartLoadWithRequest={(event) => {
              // Sites should not do this, but if you click MWA on realms it bricks us
              return !event.url.startsWith('solana-wallet:')
            }}
          />
          <BrowserFooter />
        </SafeAreaBox>
        <Box
          backgroundColor="black900"
          height={bottom}
          position="absolute"
          bottom={0}
          left={0}
          right={0}
        />
      </WalletSignBottomSheet>
    </Box>
  )
}

export default BrowserWebViewScreen

const styles = StyleSheet.create({
  rotatedArrow: {
    transform: [{ rotate: '180deg' }],
  },
})
