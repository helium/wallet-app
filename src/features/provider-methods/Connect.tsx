import React, { useCallback, useMemo, useRef } from 'react'
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
import AccountButton from '@components/AccountButton'
import { formatAccountAlias } from '@utils/accountUtils'
import { useAccountStorage } from '@config/storage/AccountStorageProvider'
import AccountSelector, {
  AccountSelectorRef,
} from '@components/AccountSelector'
import { useAsync, useAsyncCallback } from 'react-async-hook'
import useSession, { Session } from './hooks/useSession'
import ErrorDetected from './components/ErrorDetected'
import extractWebMetadata from './utils'

type Route = RouteProp<RootStackParamList, 'Connect'>
export const Connect = () => {
  const { params } = useRoute<Route>()
  const spacing = useSpacing()
  const { t } = useTranslation('')
  const navigation = useNavigation<RootNavigationProp>()
  const { currentAccount } = useAccountStorage()
  const accountSelectorRef = useRef<AccountSelectorRef>(null)
  const { connect } = useSession()

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
    if (!params.app_url)
      return {
        title: t('generic.anApp'),
        icon: null,
      }

    const { title, icon } = await extractWebMetadata(params.app_url)

    return { title: title || t('generic.anApp'), icon: icon || null }
  }, [params])

  const { execute: onConnect, loading: connecting } = useAsyncCallback(
    async () => {
      if (!currentAccount?.solanaAddress) return

      const session: Session = {
        app_url: params.app_url,
        chain: 'solana',
        cluster: undefined,
        timestamp: new Date().toISOString(),
      }

      const connectResponse = await connect(
        currentAccount?.solanaAddress,
        params.dapp_encryption_public_key,
        session,
      )

      if (!connectResponse) {
        const errorParams = new URLSearchParams({
          errorCode: '-32603',
          errorMessage: 'Failed to connect to the provider',
        })

        Linking.openURL(`${params.redirect_link}?${errorParams.toString()}`)
        return
      }

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { helium_encryption_public_key, nonce, data } = connectResponse

      const searchParams = new URLSearchParams({
        helium_encryption_public_key,
        nonce,
        data,
      })

      Linking.openURL(`${params.redirect_link}?${searchParams.toString()}`)
    },
  )

  const onCancel = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
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

  const handleAccountButtonPress = useCallback(() => {
    accountSelectorRef.current?.show()
  }, [accountSelectorRef])

  if (
    !params.app_url ||
    !params.dapp_encryption_public_key ||
    !params.redirect_link
  ) {
    return <ErrorDetected />
  }

  return (
    <>
      <ScrollBox
        padding="2xl"
        contentContainerStyle={contentContainerStyle as ViewStyle}
      >
        <ImageBox source={require('@assets/images/connectLogo.png')} />
        <Text
          variant="displayMdSemibold"
          color="primaryText"
          textAlign="center"
        >
          {t('Connect.title')}
        </Text>
        <Text
          variant="textXlRegular"
          color="text.quaternary-500"
          textAlign="center"
        >
          {t('Connect.subtitle', {
            appName: appMetadata?.title || t('generic.anApp'),
          })}
        </Text>

        <AccountButton
          accountIconSize={26}
          title={formatAccountAlias(currentAccount)}
          address={currentAccount?.solanaAddress}
          onPress={handleAccountButtonPress}
        />
        <Box flexDirection="row" marginTop="3xl">
          <Box flex={1} gap="2">
            <ButtonPressable
              flex={1}
              title={t('Connect.connect')}
              backgroundColor="primaryText"
              titleColor="primaryBackground"
              onPress={onConnect}
              loading={connecting}
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
      <AccountSelector ref={accountSelectorRef} />
    </>
  )
}

export default Connect
