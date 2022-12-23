import { useNavigation } from '@react-navigation/native'
import React, { useCallback, useMemo } from 'react'
import { WebView } from 'react-native-webview'
import { generateOnRampURL } from '@coinbase/cbpay-js'
import Box from '../../components/Box'
import ModalScreen from '../../components/ModalScreen'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import 'react-native-url-polyfill/auto'
import * as Logger from '../../utils/logger'

const CoinbaseWebView = () => {
  const { currentAccount } = useAccountStorage()
  const navigation = useNavigation()

  const onClose = useCallback(() => {
    navigation.getParent()?.goBack()
  }, [navigation])

  const coinbaseURL = useMemo(() => {
    if (!currentAccount?.solanaAddress) return

    const options = {
      appId: 'your_app_id',
      destinationWallets: [
        {
          address: currentAccount.solanaAddress,
          blockchains: ['solana'],
        },
      ],
      presetCryptoAmount: 100,
      presetFiatAmount: 100,
    }

    return generateOnRampURL(options)
  }, [currentAccount])

  const onMessage = useCallback((event) => {
    Logger.breadcrumb('onMessage', event.nativeEvent.data)
  }, [])

  return (
    <ModalScreen onClose={onClose} title="Coinbase">
      <Box flex={1}>
        <WebView source={{ uri: coinbaseURL || '' }} onMessage={onMessage} />
      </Box>
    </ModalScreen>
  )
}

export default CoinbaseWebView
