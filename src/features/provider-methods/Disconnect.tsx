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
import { useAsync, useAsyncCallback } from 'react-async-hook'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import useSession, { DisconnectPayload, Session } from './hooks/useSession'
import ErrorDetected from './components/ErrorDetected'
import extractWebMetadata from './utils'

type Route = RouteProp<RootStackParamList, 'Disconnect'>
export const Disconnect = () => {
  const { params } = useRoute<Route>()
  const spacing = useSpacing()
  const { t } = useTranslation('')
  const navigation = useNavigation<RootNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const { disconnect, getSharedSecret, decryptPayload } = useSession()

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

    const parsedPayload: DisconnectPayload = JSON.parse(decryptedPayload)

    const { session } = parsedPayload

    const parsedSession: Session = JSON.parse(session)

    const { title, icon } = await extractWebMetadata(parsedSession.app_url)

    return { title: title || t('generic.anApp'), icon: icon || null }
  }, [params])

  const contentContainerStyle = useMemo(() => {
    return {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing['2xl'],
      gap: spacing.xl,
    }
  }, [spacing])
  const { execute: onDisconnect, loading: disconnecting } = useAsyncCallback(
    async () => {
      if (!currentAccount?.solanaAddress) return

      try {
        await disconnect(
          params.dapp_encryption_public_key,
          params.payload,
          params.nonce,
        )

        Linking.openURL(`${params.redirect_link}`)
      } catch (e) {
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
      <ImageBox source={require('@assets/images/disconnectLogo.png')} />
      <Text variant="displayMdSemibold" color="primaryText" textAlign="center">
        {t('Disconnect.title')}
      </Text>
      <Text
        variant="textXlRegular"
        color="text.quaternary-500"
        textAlign="center"
      >
        {t('Disconnect.subtitle', {
          appName: appMetadata?.title || t('generic.anApp'),
        })}
      </Text>
      <Box flexDirection="row" marginTop="3xl">
        <Box flex={1} gap="2">
          <ButtonPressable
            flex={1}
            title={t('Disconnect.disconnect')}
            backgroundColor="primaryText"
            titleColor="primaryBackground"
            onPress={onDisconnect}
            customLoadingColor="primaryBackground"
          />
          <ButtonPressable
            flex={1}
            title={t('generic.cancel')}
            backgroundColor="gray.800"
            titleColor="primaryText"
            onPress={onCancel}
            loading={disconnecting}
          />
        </Box>
      </Box>
    </ScrollBox>
  )
}

export default Disconnect
