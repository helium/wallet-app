import React, { useCallback, useMemo } from 'react'
import Box from '@components/Box'
import Text from '@components/Text'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { RootNavigationProp, RootStackParamList } from '@app/rootTypes'
import ScrollBox from '@components/ScrollBox'
import { useSpacing } from '@config/theme/themeHooks'
import { Linking, ViewStyle } from 'react-native'
import { useTranslation } from 'react-i18next'
import ImageBox from '@components/ImageBox'
import ButtonPressable from '@components/ButtonPressable'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useSolana } from '@features/solana/SolanaProvider'
import { Transaction } from '@solana/web3.js'
import { bs58 } from '@coral-xyz/anchor/dist/cjs/utils/bytes'
import { WalletStandardMessageTypes } from '@features/solana/walletSignBottomSheetTypes'
import { useWalletSign } from '@features/solana/WalletSignProvider'
import ErrorDetected from './components/ErrorDetected'
import useSession, {
  Session,
  SignTransactionsPayload,
} from './hooks/useSession'
import extractWebMetadata from './utils'

type Route = RouteProp<RootStackParamList, 'SignAllTransactions'>
export const SignAllTransactions = () => {
  const { params } = useRoute<Route>()
  const spacing = useSpacing()
  const { t } = useTranslation('')
  const navigation = useNavigation<RootNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const {
    signAllTransactions,
    getSharedSecret,
    encryptPayload,
    decryptPayload,
  } = useSession()
  const { walletSignBottomSheetRef } = useWalletSign()
  const { anchorProvider } = useSolana()

  const contentContainerStyle = useMemo(() => {
    return {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['2xl'],
      gap: spacing.xl,
    }
  }, [spacing])

  const { result: appMetadata } = useAsync(async () => {
    if (!params.nonce || !params.dapp_encryption_public_key || !params.payload)
      return {
        title: t('generic.anApp'),
        icon: null,
      }

    const sharedSecret = await getSharedSecret(
      params.dapp_encryption_public_key,
    )

    const decryptedPayload = await decryptPayload(
      params.payload,
      params.nonce,
      sharedSecret,
    )

    const parsedPayload: SignTransactionsPayload = JSON.parse(decryptedPayload)

    const { session } = parsedPayload

    const parsedSession: Session = JSON.parse(session)

    const { title, icon } = await extractWebMetadata(parsedSession.app_url)

    return { title: title || t('generic.anApp'), icon: icon || null }
  }, [params])

  const { execute: onSignAllTransactions, loading: signing } = useAsyncCallback(
    async () => {
      if (!currentAccount?.solanaAddress) return

      try {
        const signAllTransactionsResponse = await signAllTransactions(
          params.dapp_encryption_public_key,
          params.payload,
          params.nonce,
        )

        if (!signAllTransactionsResponse) {
          const errorParams = new URLSearchParams({
            errorCode: '-32603',
            errorMessage: 'Failed to connect to the provider',
          })

          Linking.openURL(`${params.redirect_link}?${errorParams.toString()}`)
          return
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { transactions } = signAllTransactionsResponse

        const parsedSession: Session = JSON.parse(params.payload)

        // TODO: Support Versioned Transactions
        const txns = transactions.map((tx: string) =>
          Transaction.from(bs58.decode(tx)),
        )

        const decision = await walletSignBottomSheetRef?.show({
          type: WalletStandardMessageTypes.signTransaction,
          url: parsedSession.app_url,
          serializedTxs: txns.map((tx) =>
            tx.serialize({
              requireAllSignatures: false,
            }),
          ),
        })

        if (!decision) {
          const errorParams = new URLSearchParams({
            errorCode: '-32000',
            errorMessage: 'User rejected the request',
          })

          Linking.openURL(`${params.redirect_link}?${errorParams.toString()}`)
          return
        }

        const signedTransactions =
          await anchorProvider?.wallet.signAllTransactions(txns)

        const sharedSecret = await getSharedSecret(
          params.dapp_encryption_public_key,
        )

        const [nonce, encryptedPayload] = encryptPayload(
          JSON.stringify({
            transactions: signedTransactions?.map((tx) =>
              bs58.encode(tx.serialize()),
            ),
          }),
          sharedSecret,
        )

        const searchParams = new URLSearchParams({
          nonce: bs58.encode(nonce),
          data: bs58.encode(encryptedPayload),
        })

        Linking.openURL(`${params.redirect_link}?${searchParams.toString()}`)
      } catch {
        const errorParams = new URLSearchParams({
          errorCode: '-32603',
          errorMessage: 'Failed to connect to the provider',
        })

        Linking.openURL(`${params.redirect_link}?${errorParams.toString()}`)
      }
    },
  )

  const onCancel = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.popToTop()
    } else {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: currentAccount
              ? 'ServiceSheetNavigator'
              : 'OnboardingNavigator',
          },
        ],
      })
    }
  }, [navigation, currentAccount])

  if (
    !params.nonce ||
    !params.dapp_encryption_public_key ||
    !params.redirect_link ||
    !params.payload
  ) {
    return <ErrorDetected />
  }

  return (
    <ScrollBox
      padding="2xl"
      contentContainerStyle={contentContainerStyle as ViewStyle}
    >
      <ImageBox source={require('@assets/images/signTransactionsLogo.png')} />
      <Text variant="displayMdSemibold" color="primaryText" textAlign="center">
        {t('SignAllTransactions.title')}
      </Text>
      <Text
        variant="textXlRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('SignAllTransactions.subtitle', {
          appName: appMetadata?.title || t('generic.anApp'),
        })}
      </Text>
      <Box flexDirection="row" marginTop="3xl">
        <Box flex={1} gap="2">
          <ButtonPressable
            flex={1}
            title={t('SignAllTransactions.sign')}
            backgroundColor="primaryText"
            titleColor="primaryBackground"
            onPress={onSignAllTransactions}
            loading={signing}
            customLoadingColor="primaryBackground"
          />
          <ButtonPressable
            flex={1}
            title={t('generic.cancel')}
            backgroundColor="gray.800"
            titleColor="primaryText"
            onPress={onCancel}
          />
        </Box>
      </Box>
    </ScrollBox>
  )
}

export default SignAllTransactions
