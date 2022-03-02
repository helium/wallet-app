import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { memo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { getUnixTime } from 'date-fns'
import { Keypair, WalletLink } from '@helium/react-native-sdk'
import { getBundleId } from 'react-native-device-info'
import ChevronDown from '@assets/images/chevronDown.svg'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import { useAccountSelector } from '../../components/AccountSelector'
import AccountIcon from '../../components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { formatAccountAlias } from '../../utils/accountUtils'

const makeAppLinkAuthToken = async (
  tokenOpts: WalletLink.LinkWalletRequest & {
    signingAppId: string
    time: number
    address: string
  },
  keypair: Keypair,
) => {
  const stringifiedToken = JSON.stringify(tokenOpts)
  const buffer = await keypair.sign(stringifiedToken)

  const signature = buffer.toString('base64')

  const signedToken = { ...tokenOpts, signature }
  return Buffer.from(JSON.stringify(signedToken)).toString('base64')
}

type Route = RouteProp<HomeStackParamList, 'LinkWallet'>
const LinkWallet = () => {
  const {
    params: { requestAppId, callbackUrl, appName },
  } = useRoute<Route>()
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const { show } = useAccountSelector()
  const { currentAccount, getKeypair } = useAccountStorage()

  const callback = useCallback(
    async (responseParams: WalletLink.LinkWalletResponse) => {
      const url = WalletLink.createLinkWalletCallbackUrl(
        callbackUrl,
        currentAccount?.address || '',
        responseParams,
      )
      Linking.openURL(url)

      navigation.goBack()
    },
    [callbackUrl, currentAccount, navigation],
  )

  const handleLink = useCallback(async () => {
    if (!currentAccount?.address) return
    const keypair = await getKeypair()
    if (!keypair) return

    const time = getUnixTime(new Date())
    const token = await makeAppLinkAuthToken(
      {
        time,
        address: currentAccount.address,
        requestAppId,
        signingAppId: getBundleId(),
        callbackUrl,
        appName,
      },
      keypair,
    )
    callback({ token, status: 'success' })
  }, [currentAccount, getKeypair, requestAppId, callbackUrl, appName, callback])

  const handleCancel = useCallback(async () => {
    callback({ status: 'user_cancelled' })
  }, [callback])

  return (
    <SafeAreaBox
      backgroundColor="primaryBackground"
      flex={1}
      padding="l"
      justifyContent="center"
    >
      <Text variant="body1" fontSize={32} marginTop="m">
        {t('linkWallet.title', { appName })}
      </Text>
      <Text variant="body1" marginVertical="m">
        {t('linkWallet.body', { appName })}
      </Text>

      <TouchableOpacityBox
        paddingHorizontal="xl"
        paddingVertical="l"
        borderBottomColor="primaryBackground"
        borderBottomWidth={1}
        flexDirection="row"
        alignItems="center"
        onPress={show}
      >
        <AccountIcon size={26} address={currentAccount?.address} />
        <Text marginLeft="ms" variant="subtitle2" flex={1}>
          {formatAccountAlias(currentAccount)}
        </Text>
        <ChevronDown />
      </TouchableOpacityBox>

      <TouchableOpacityBox
        marginTop="ms"
        minHeight={56}
        backgroundColor="surfaceContrast"
        justifyContent="center"
        borderRadius="round"
        onPress={handleLink}
      >
        <Text
          variant="subtitle1"
          color="surfaceContrastText"
          textAlign="center"
        >
          {t('linkWallet.yes')}
        </Text>
      </TouchableOpacityBox>

      <TouchableOpacityBox
        minHeight={56}
        justifyContent="center"
        backgroundColor="secondary"
        marginTop="ms"
        borderRadius="round"
        onPress={handleCancel}
      >
        <Text variant="subtitle1" color="primaryText" textAlign="center">
          {t('linkWallet.no')}
        </Text>
      </TouchableOpacityBox>
    </SafeAreaBox>
  )
}

export default memo(LinkWallet)
