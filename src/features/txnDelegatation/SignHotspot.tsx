import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking } from 'react-native'
import { AddGateway, Location, Transfer } from '@helium/react-native-sdk'
import animalHash from 'angry-purple-tiger'
import { useAsync } from 'react-async-hook'
import {
  verifyWalletLinkToken,
  parseWalletLinkToken,
  SignHotspotResponse,
  createSignHotspotCallbackUrl,
} from '@helium/wallet-link'
import Toast from 'react-native-simple-toast'
import Box from '../../components/Box'
import SafeAreaBox from '../../components/SafeAreaBox'
import Text from '../../components/Text'
import TouchableOpacityBox from '../../components/TouchableOpacityBox'
import { HomeNavigationProp, HomeStackParamList } from '../home/homeTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import AccountIcon from '../../components/AccountIcon'
import { formatAccountAlias } from '../../utils/accountUtils'
import { getKeypair } from '../../storage/secureStorage'
import { useSubmitTxnMutation } from '../../generated/graphql'
import { useColors } from '../../theme/themeHooks'
import * as Logger from '../../utils/logger'

type Route = RouteProp<HomeStackParamList, 'SignHotspot'>
const SignHotspot = () => {
  const {
    params: {
      token,
      addGatewayTxn,
      assertLocationTxn,
      transferHotspotTxn,
      submit,
    } = {
      token: '',
      addGatewayTxn: '',
      assertLocationTxn: '',
      transferHotspotTxn: '',
      submit: false,
    },
  } = useRoute<Route>()
  const navigation = useNavigation<HomeNavigationProp>()
  const { t } = useTranslation()
  const [validated, setValidated] = useState<boolean>()
  const { accounts } = useAccountStorage()
  const { surfaceContrastText } = useColors()
  const [submitTxnMutation, { loading: submitLoading }] = useSubmitTxnMutation()

  const linkInvalid = useMemo(() => {
    return !addGatewayTxn && !assertLocationTxn && !transferHotspotTxn
  }, [addGatewayTxn, assertLocationTxn, transferHotspotTxn])

  const parsedToken = useMemo(() => {
    if (!token) return
    return parseWalletLinkToken(token)
  }, [token])

  const callback = useCallback(
    async (responseParams: SignHotspotResponse) => {
      if (!parsedToken?.callbackUrl) return
      const url = createSignHotspotCallbackUrl(
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

  const transferTxn = useMemo(() => {
    if (!transferHotspotTxn) return
    return Transfer.txnFromString(transferHotspotTxn)
  }, [transferHotspotTxn])

  const gatewayAddress = useMemo(
    () =>
      gatewayTxn?.gateway?.b58 ||
      locationTxn?.gateway?.b58 ||
      transferTxn?.gateway?.b58,
    [gatewayTxn, locationTxn, transferTxn],
  )

  const handleLink = useCallback(async () => {
    if (!parsedToken) return

    if (submit) {
      // submitting signed transaction from hotspot app
      const txn = assertLocationTxn || transferHotspotTxn
      const txnObject = locationTxn || transferTxn

      try {
        if (!txn) throw new Error('no transaction')

        await submitTxnMutation({
          variables: {
            address: parsedToken.address,
            txn,
            txnJson: JSON.stringify(txnObject),
          },
        })
        Toast.show(t('generic.submitSuccess'))
      } catch (e) {
        Logger.error(e)
        Toast.show(t('generic.somethingWentWrong'))
      }
      navigation.goBack()
      return
    }

    try {
      const ownerKeypair = await getKeypair(parsedToken.address || '')

      const responseParams = {
        status: 'success',
        gatewayAddress,
      } as SignHotspotResponse

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

      if (transferTxn) {
        if (!ownerKeypair) {
          callback({ status: 'token_not_found' })
          throw new Error('Failed to sign transfer txn')
        }

        const txnTransferSigned = await transferTxn.sign({
          owner: ownerKeypair,
        })

        if (!txnTransferSigned.gateway?.b58) {
          callback({ status: 'gateway_not_found' })
          throw new Error('Failed to sign transfer txn')
        }

        responseParams.transferTxn = txnTransferSigned.toString()
      }

      callback(responseParams)
    } catch (e) {
      // Logger.error(e)
    }
  }, [
    assertLocationTxn,
    callback,
    gatewayAddress,
    gatewayTxn,
    locationTxn,
    navigation,
    parsedToken,
    submit,
    submitTxnMutation,
    t,
    transferHotspotTxn,
    transferTxn,
  ])

  const handleCancel = useCallback(async () => {
    callback({ status: 'user_cancelled' })
  }, [callback])

  const handleError = useCallback(async () => {
    callback({ status: 'invalid_link' })
  }, [callback])

  const name = useMemo(() => {
    if (!gatewayAddress) return
    return animalHash(gatewayAddress || '')
  }, [gatewayAddress])

  const location = useMemo(() => {
    return locationTxn?.location
  }, [locationTxn])

  const title = useMemo(() => {
    if (gatewayTxn) {
      return t('signHotspot.title')
    }
    if (locationTxn) {
      return t('signHotspot.titleLocationOnly')
    }
    if (transferTxn) {
      return t('signHotspot.titleTransfer')
    }
  }, [gatewayTxn, locationTxn, t, transferTxn])

  useAsync(async () => {
    if (!parsedToken) return

    verifyWalletLinkToken(parsedToken)
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
        {title}
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
        {transferTxn?.newOwner !== undefined && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('signHotspot.newOwner')}
            </Text>
            <Text
              variant="subtitle1"
              color="surfaceContrastText"
              marginBottom="m"
            >
              {transferTxn.newOwner.b58}
            </Text>
          </>
        )}
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
          disabled={submitLoading}
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
          disabled={!validated || submitLoading}
          flexDirection="row"
          alignItems="center"
        >
          <Text
            variant="subtitle1"
            textAlign="center"
            color="surfaceContrastText"
          >
            {t('generic.confirm')}
          </Text>
          {submitLoading && (
            <Box marginLeft="s">
              <ActivityIndicator color={surfaceContrastText} />
            </Box>
          )}
        </TouchableOpacityBox>
      </Box>
    </SafeAreaBox>
  )
}

export default memo(SignHotspot)
