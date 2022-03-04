import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking } from 'react-native'
import { AddGateway, WalletLink, Location } from '@helium/react-native-sdk'
import animalHash from 'angry-purple-tiger'
import { useAsync } from 'react-async-hook'
import Box from '../../components/Box'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import verifyAppLinkAuthToken from './verifyAppLinkAuthToken'
import AccountIcon from '../../components/AccountIcon'
import { formatAccountAlias } from '../../utils/accountUtils'
import { getKeypair } from '../../storage/secureStorage'

type Route = RouteProp<HomeStackParamList, 'SignHotspot'>
const SignHotspot = () => {
  const {
    params: { token, addGatewayTxn, assertLocationTxn } = {
      token: '',
      addGatewayTxn: '',
      assertLocationTxn: '',
    },
  } = useRoute<Route>()
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const [validated, setValidated] = useState<boolean>()
  const { accounts, currentAccount } = useAccountStorage()

  const linkInvalid = useMemo(() => {
    return !addGatewayTxn && !assertLocationTxn
  }, [addGatewayTxn, assertLocationTxn])

  const parsedToken = useMemo(() => {
    if (!token) return
    return WalletLink.parseWalletLinkToken(token)
  }, [token])

  const callback = useCallback(
    async (responseParams: WalletLink.SignHotspotResponse) => {
      if (!parsedToken?.callbackUrl) return
      const url = WalletLink.createSignHotspotCallbackUrl(
        parsedToken.callbackUrl,
        responseParams,
      )
      Linking.openURL(url)

      navigation.goBack()
    },
    [navigation, parsedToken],
  )

  useEffect(() => {
    if (validated === false) {
      callback({ status: 'token_not_found' })
    }
  }, [callback, validated])

  const gatewayTxn = useMemo(() => {
    if (!addGatewayTxn) return
    return AddGateway.txnFromString(addGatewayTxn)
  }, [addGatewayTxn])

  const locationTxn = useMemo(() => {
    if (!assertLocationTxn) return
    return Location.txnFromString(assertLocationTxn)
  }, [assertLocationTxn])

  const handleLink = useCallback(async () => {
    try {
      const ownerKeypair = await getKeypair(currentAccount?.address || '')

      const responseParams = {
        status: 'success',
        gatewayAddress: gatewayTxn?.gateway?.b58 || locationTxn?.gateway?.b58,
      } as WalletLink.SignHotspotResponse

      if (gatewayTxn) {
        const txnOwnerSigned = await gatewayTxn.sign({
          owner: ownerKeypair,
        })

        if (!txnOwnerSigned.gateway?.b58) {
          callback({ status: 'gateway_not_found' })
          throw new Error('Failed to sign gateway txn')
        }

        responseParams.gatewayTxn = txnOwnerSigned.toString()
      }

      if (locationTxn && locationTxn.gateway?.b58) {
        const ownerIsPayer = locationTxn.payer?.b58 === locationTxn.owner?.b58
        const txnOwnerSigned = await locationTxn.sign({
          owner: ownerKeypair,
          payer: ownerIsPayer ? ownerKeypair : undefined,
        })
        responseParams.assertTxn = txnOwnerSigned.toString()
      }

      callback(responseParams)
    } catch (e) {
      // Logger.error(e)
    }
  }, [callback, currentAccount, gatewayTxn, locationTxn])

  const handleCancel = useCallback(async () => {
    callback({ status: 'user_cancelled' })
  }, [callback])

  const handleError = useCallback(async () => {
    callback({ status: 'invalid_link' })
  }, [callback])

  const name = useMemo(() => {
    if (!gatewayTxn?.gateway?.b58 && !locationTxn?.gateway?.b58) return
    return animalHash(
      gatewayTxn?.gateway?.b58 || locationTxn?.gateway?.b58 || '',
    )
  }, [gatewayTxn, locationTxn])

  const location = useMemo(() => {
    return locationTxn?.location
  }, [locationTxn])

  useAsync(async () => {
    if (!parsedToken) return

    const keypair = await getKeypair(parsedToken.address)
    if (!keypair) {
      setValidated(false)
      return
    }

    verifyAppLinkAuthToken(parsedToken, keypair)
      .then((valid) => {
        setValidated(valid)
      })
      .catch(() => {
        setValidated(false)
      })
  }, [getKeypair, parsedToken, token])

  if (linkInvalid) {
    return (
      <SafeAreaBox backgroundColor="primaryBackground" flex={1} padding="xl">
        <Box justifyContent="center" flex={1}>
          <Text variant="body1" marginBottom="m">
            {t('signHotspot.error.title')}
          </Text>
          <Text variant="body1">
            {t('signHotspot.error.subtitle', {
              maker: parsedToken?.appName || 'Maker',
            })}
          </Text>
        </Box>
        {parsedToken?.callbackUrl && (
          <Box justifyContent="flex-end" flex={1}>
            <TouchableOpacityBox
              minHeight={56}
              justifyContent="center"
              borderRadius="l"
              onPress={handleError}
            >
              <Text variant="body1" textAlign="center">
                {t('signHotspot.error.takeMeBack', {
                  maker: parsedToken?.appName || 'Maker',
                })}
              </Text>
            </TouchableOpacityBox>
          </Box>
        )}
      </SafeAreaBox>
    )
  }

  return (
    <SafeAreaBox
      backgroundColor="primaryBackground"
      flex={1}
      padding="xl"
      justifyContent="center"
    >
      <Text variant="h1" color="primaryText">
        {t(gatewayTxn ? 'signHotspot.title' : 'signHotspot.titleLocationOnly')}
      </Text>

      <Box
        backgroundColor="surfaceContrast"
        borderRadius="l"
        padding="l"
        marginTop="l"
      >
        <Text variant="body1" color="surfaceContrastText">
          {t('signHotspot.name')}
        </Text>
        <Text variant="subtitle1" color="surfaceContrastText" marginBottom="m">
          {name}
        </Text>
        {location && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('signHotspot.location')}
            </Text>
            <Text
              variant="subtitle1"
              color="surfaceContrastText"
              marginBottom="m"
            >
              {location}
            </Text>
          </>
        )}
        <Box flexDirection="row">
          {locationTxn?.gain !== undefined && (
            <Box marginEnd="xxl">
              <Text variant="body1" color="surfaceContrastText">
                {t('signHotspot.gain')}
              </Text>
              <Text
                variant="subtitle1"
                color="surfaceContrastText"
                marginBottom="m"
              >
                {locationTxn.gain}
              </Text>
            </Box>
          )}
          {locationTxn?.elevation !== undefined && (
            <Box>
              <Text variant="body1" color="surfaceContrastText">
                {t('signHotspot.elevation')}
              </Text>
              <Text
                variant="subtitle1"
                color="surfaceContrastText"
                marginBottom="m"
              >
                {locationTxn.elevation}
              </Text>
            </Box>
          )}
        </Box>
        {!!parsedToken?.address && accounts?.[parsedToken.address] && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('signHotspot.owner')}
            </Text>
            <Box flexDirection="row" alignItems="center" marginBottom="m">
              <AccountIcon size={20} address={parsedToken.address} />
              <Text
                variant="subtitle1"
                marginLeft="s"
                flex={1}
                color="surfaceContrastText"
              >
                {formatAccountAlias(accounts[parsedToken.address])}
              </Text>
            </Box>
          </>
        )}
        {!!parsedToken?.appName && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('signHotspot.maker')}
            </Text>
            <Text variant="subtitle1" color="surfaceContrastText">
              {parsedToken.appName}
            </Text>
          </>
        )}
      </Box>
      <Box flexDirection="row" marginTop="l">
        <TouchableOpacityBox
          flex={1}
          minHeight={66}
          justifyContent="center"
          marginEnd="m"
          backgroundColor="secondary"
          borderRadius="round"
          onPress={handleCancel}
        >
          <Text variant="subtitle1" textAlign="center" color="primaryText">
            {t('generic.cancel')}
          </Text>
        </TouchableOpacityBox>
        <TouchableOpacityBox
          flex={1}
          minHeight={66}
          backgroundColor="surfaceContrast"
          justifyContent="center"
          borderRadius="round"
          onPress={handleLink}
          disabled={!validated}
        >
          <Text
            variant="subtitle1"
            textAlign="center"
            color="surfaceContrastText"
          >
            {t('generic.confirm')}
          </Text>
        </TouchableOpacityBox>
      </Box>
    </SafeAreaBox>
  )
}

export default memo(SignHotspot)
