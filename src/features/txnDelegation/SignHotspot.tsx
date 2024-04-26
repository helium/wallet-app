import AccountIcon from '@components/AccountIcon'
import Box from '@components/Box'
import SafeAreaBox from '@components/SafeAreaBox'
import Text from '@components/Text'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import OnboardingClient, {
  OnboardingRecord,
  degToCompass,
} from '@helium/onboarding'
import {
  SignHotspotResponse,
  createSignHotspotCallbackUrl,
  parseWalletLinkToken,
  verifyWalletLinkToken,
} from '@helium/wallet-link'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useColors } from '@theme/themeHooks'
import animalHash from 'angry-purple-tiger'
import BN from 'bn.js'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useAsync } from 'react-async-hook'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Linking } from 'react-native'
import Config from 'react-native-config'
import Toast from 'react-native-simple-toast'
import {
  RootNavigationProp,
  RootStackParamList,
} from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { getKeypair } from '../../storage/secureStorage'
import { formatAccountAlias } from '../../utils/accountUtils'
import * as Logger from '../../utils/logger'
import { HomeNavigationProp } from '../home/homeTypes'
import useSolTxns from './useSolTxns'

const onboardingClient = new OnboardingClient(`${Config.ONBOARDING_API_URL}/v3`)
const METERS_TO_FEET = 3.28084
type Route = RouteProp<RootStackParamList, 'SignHotspot'>
const SignHotspot = () => {
  const { params, ...route } = useRoute<Route>()
  const { token, submit } = params
  const [onboardingRecord, setOnboardingRecord] = useState<OnboardingRecord>()

  const solana = useSolTxns({
    heliumAddress: parseWalletLinkToken(token).address,
    deepLinkPath: route.path,
    solanaTransactions: params.solanaTransactions,
    configMsgStr: params.configurationMessage,
  })

  const navigation = useNavigation<HomeNavigationProp>()
  const rootNav = useNavigation<RootNavigationProp>()
  const { t } = useTranslation()
  const [validated, setValidated] = useState<boolean>()
  const { accounts } = useAccountStorage()
  const { surfaceContrastText } = useColors()

  const linkInvalid = useMemo(() => {
    return (
      !params.addGatewayTxn &&
      !params.assertLocationTxn &&
      !params.transferHotspotTxn &&
      !params.solanaTransactions &&
      !params.configurationMessage
    )
  }, [params])

  const parsedToken = useMemo(() => {
    if (!token) return
    return parseWalletLinkToken(token)
  }, [token])

  const callback = useCallback(
    async (responseParams: SignHotspotResponse) => {
      if (!parsedToken?.callbackUrl) return

      const url = createSignHotspotCallbackUrl(parsedToken.callbackUrl, {
        ...params, // include the original params in the response
        ...responseParams, // override with the response params
      })
      Linking.openURL(url)

      if (navigation.canGoBack()) {
        navigation.goBack()
      } else {
        rootNav.reset({
          index: 0,
          routes: [{ name: 'TabBarNavigator' }],
        })
      }
    },
    [navigation, params, parsedToken, rootNav],
  )

  useEffect(() => {
    if (validated === false) {
      callback({ status: 'token_not_found' })
    }
  }, [callback, validated])

  const gatewayAddress = useMemo(
    () => solana.gatewayAddress,
    [solana.gatewayAddress],
  )

  useEffect(() => {
    if (!gatewayAddress) return
    onboardingClient.getOnboardingRecord(gatewayAddress).then((response) => {
      if (!response.data) return
      setOnboardingRecord(response.data)
    })
  }, [gatewayAddress])

  const submitNow = useCallback(async () => {
    if (!parsedToken) return

    // submitting signed transaction from hotspot app
    try {
      if (solana.hasTransactions) {
        await solana.submit()
      } else {
        throw new Error('')
      }

      Toast.show(t('generic.submitSuccess'))
    } catch (e) {
      Logger.error(e)
      Toast.show(t('generic.somethingWentWrong'))
    }

    navigation.goBack()
  }, [navigation, parsedToken, solana, t])

  const handleLink = useCallback(async () => {
    if (!parsedToken) return

    if (submit) {
      return submitNow()
    }

    if (solana.hasTransactions) {
      solana.sign(callback)
    }
  }, [callback, parsedToken, solana, submit, submitNow])

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

  const locationData = useMemo(():
    | {
        location?: string
        elevation?: number
        gain?: number
      }
    | undefined => {
    return solana.assertData
  }, [solana.assertData])

  const transferData = useMemo((): { newOwner: string } | undefined => {
    if (solana.transferData?.newOwner) {
      return solana.transferData
    }
  }, [solana.transferData])

  const title = useMemo(() => {
    const hasIotOnboard =
      !!solana.transactions.onboardIotHotspotV0?.gatewayAddress
    const hasMobileOnboard =
      !!solana.transactions.onboardMobileHotspotV0?.gatewayAddress
    if (hasIotOnboard || hasMobileOnboard) {
      let networks = ''
      if (hasIotOnboard && hasMobileOnboard) {
        networks = 'IOT + MOBILE'
      } else if (hasIotOnboard) {
        networks = 'IOT'
      } else if (hasMobileOnboard) {
        networks = 'MOBILE'
      }
      return t('signHotspot.title', { networks })
    }

    if (transferData) {
      return t('signHotspot.titleTransfer')
    }

    if (locationData) {
      return t('signHotspot.titleLocationOnly')
    }

    if (solana.configMsg) {
      return t('signHotspot.titleConfig')
    }
  }, [locationData, solana.configMsg, solana.transactions, t, transferData])

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

  const submitLoading = useMemo(
    () => solana.submitLoading,
    [solana.submitLoading],
  )

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
      {title ? (
        <Text
          variant="h1"
          letterSpacing={-0.5}
          lineHeight={42}
          color="primaryText"
          numberOfLines={2}
          maxFontSizeMultiplier={1}
          adjustsFontSizeToFit
        >
          {title}
        </Text>
      ) : (
        <ActivityIndicator />
      )}

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
        {locationData?.location && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('signHotspot.location')}
            </Text>
            <Text
              variant="subtitle1"
              color="surfaceContrastText"
              marginBottom="m"
            >
              {locationData.location}
            </Text>
          </>
        )}
        {solana.configMsg && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('signHotspot.direction')}
            </Text>
            <Text
              variant="subtitle1"
              color="surfaceContrastText"
              marginBottom="m"
            >
              {`${(
                METERS_TO_FEET * solana.configMsg.height
              ).toLocaleString()}ft/${solana.configMsg.azimuth}° ${degToCompass(
                solana.configMsg.azimuth,
              )}`}
            </Text>
          </>
        )}
        <Box flexDirection="row">
          {locationData?.gain !== undefined && (
            <Box marginEnd="xxl">
              <Text variant="body1" color="surfaceContrastText">
                {t('generic.gain')}:
              </Text>
              <Text
                variant="subtitle1"
                color="surfaceContrastText"
                marginBottom="m"
              >
                {locationData.gain}
              </Text>
            </Box>
          )}
          {locationData?.elevation !== undefined && (
            <Box>
              <Text variant="body1" color="surfaceContrastText">
                {t('generic.elevation')}:
              </Text>
              <Text
                variant="subtitle1"
                color="surfaceContrastText"
                marginBottom="m"
              >
                {locationData.elevation}
              </Text>
            </Box>
          )}
        </Box>
        {(solana.burnAmounts?.hntFee?.gt(new BN(0)) ||
          solana.burnAmounts?.dcFee?.gt(new BN(0))) && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('signHotspot.burnAmounts')}
            </Text>

            {solana.burnAmounts?.dcFee?.gt(new BN(0)) && (
              <Text
                variant="subtitle1"
                color="surfaceContrastText"
                marginBottom="m"
              >
                {solana.burnAmounts?.dcFee?.toString()}
              </Text>
            )}

            {solana.burnAmounts?.hntFee?.gt(new BN(0)) && (
              <Text
                variant="subtitle1"
                color="surfaceContrastText"
                marginBottom="m"
              >
                {solana.burnAmounts?.hntFee?.toString()}
              </Text>
            )}
          </>
        )}
        {transferData?.newOwner && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('signHotspot.newOwner')}
            </Text>
            <Text
              variant="subtitle1"
              color="surfaceContrastText"
              marginBottom="m"
            >
              {transferData.newOwner}
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
        {!!gatewayAddress && (
          <>
            <Text variant="body1" color="surfaceContrastText">
              {t('generic.maker')}:
            </Text>
            <Text variant="subtitle1" color="surfaceContrastText">
              {onboardingRecord?.maker.name || 'Unknown'}
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
          disabled={!validated || submitLoading || !solana.hasTransactions}
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
