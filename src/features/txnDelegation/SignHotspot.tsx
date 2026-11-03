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
import { AccountIcon } from '@ui/AccountIcon'
import { Button } from '@ui/Button'
import { buttonTextVariants } from '@ui/buttonVariants'
import { Spinner } from '@ui/Spinner'
import { Text } from '@ui/Text'
import animalHash from 'angry-purple-tiger'
import BN from 'bn.js'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Linking, View } from 'react-native'
import Config from '@utils/config'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-simple-toast'
import { withUniwind } from 'uniwind'
import {
  RootNavigationProp,
  RootStackParamList,
} from '../../navigation/rootTypes'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { formatAccountAlias } from '../../utils/accountUtils'
import * as Logger from '../../utils/logger'
import { HomeNavigationProp } from '../home/homeTypes'
import useSolTxns from './useSolTxns'

// The hotspot app sends signed transactions; with none there is nothing to
// submit, which the caller reports as a failure.
const submitSignedTransactions = async (solana: {
  hasTransactions: boolean
  submit: () => Promise<unknown>
}) => {
  if (!solana.hasTransactions) throw new Error('')
  await solana.submit()
}

const onboardingClient = new OnboardingClient(`${Config.ONBOARDING_API_URL}/v3`)
const METERS_TO_FEET = 3.28084
const heightFormat = new Intl.NumberFormat()
const SafeArea = withUniwind(SafeAreaView)
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

  const linkInvalid =
    !params.addGatewayTxn &&
    !params.assertLocationTxn &&
    !params.transferHotspotTxn &&
    !params.solanaTransactions &&
    !params.configurationMessage

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
      void Linking.openURL(url)

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
      void callback({ status: 'token_not_found' })
    }
  }, [callback, validated])

  const { gatewayAddress } = solana

  useEffect(() => {
    if (!gatewayAddress) return
    void onboardingClient
      .getOnboardingRecord(gatewayAddress)
      .then((response) => {
        if (!response.data) return
        setOnboardingRecord(response.data)
      })
  }, [gatewayAddress])

  const submitNow = async () => {
    if (!parsedToken) return

    // submitting signed transaction from hotspot app
    try {
      await submitSignedTransactions(solana)

      Toast.show(t('generic.submitSuccess'), Toast.SHORT)
    } catch (e) {
      Logger.error(e)
      Toast.show(t('generic.somethingWentWrong'), Toast.SHORT)
    }

    navigation.goBack()
  }

  const handleLink = async () => {
    if (!parsedToken) return

    if (submit) {
      return submitNow()
    }

    if (solana.hasTransactions) {
      await solana.sign(callback)
    }
  }

  const handleCancel = async () => {
    await callback({ status: 'user_cancelled' })
  }

  const handleError = async () => {
    await callback({ status: 'invalid_link' })
  }

  const name = gatewayAddress ? animalHash(gatewayAddress || '') : undefined

  const locationData:
    | {
        location?: string
        elevation?: number
        gain?: number
      }
    | undefined = solana.assertData

  const transferData: { newOwner: string } | undefined = solana.transferData
    ?.newOwner
    ? solana.transferData
    : undefined

  const title = (() => {
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
  })()

  useEffect(() => {
    if (!parsedToken) return

    verifyWalletLinkToken(parsedToken)
      .then((valid) => {
        setValidated(valid)
      })
      .catch(() => {
        setValidated(false)
      })
  }, [parsedToken])

  const { submitLoading } = solana

  if (linkInvalid) {
    return (
      <SafeArea className="flex-1 bg-background p-8">
        <View className="flex-1 justify-center">
          <Text size="base" className="mb-4">
            {t('signHotspot.error.title')}
          </Text>
          <Text size="base">
            {t('signHotspot.error.subtitle', {
              maker: parsedToken?.appName || 'Maker',
            })}
          </Text>
        </View>
        {!!parsedToken?.callbackUrl && (
          <View className="flex-1 justify-end">
            <Button
              variant="ghost"
              size="dashboard"
              className="w-full"
              onPress={() => void handleError().catch(console.error)}
            >
              {t('signHotspot.error.takeMeBack', {
                maker: parsedToken?.appName || 'Maker',
              })}
            </Button>
          </View>
        )}
      </SafeArea>
    )
  }

  return (
    <SafeArea className="flex-1 justify-center bg-background p-8">
      {title ? (
        <Text
          size="4xl"
          className="tracking-tight"
          numberOfLines={2}
          maxFontSizeMultiplier={1.2}
        >
          {title}
        </Text>
      ) : (
        <Spinner />
      )}

      <View className="mt-6 rounded-[12px] bg-primary p-6">
        <Text size="base" className="text-primary-foreground">
          {t('signHotspot.name')}
        </Text>
        <Text size="xl" className="mb-4 font-medium text-primary-foreground">
          {name}
        </Text>
        {!!locationData?.location && (
          <>
            <Text size="base" className="text-primary-foreground">
              {t('signHotspot.location')}
            </Text>
            <Text
              size="xl"
              className="mb-4 font-medium text-primary-foreground"
            >
              {locationData.location}
            </Text>
          </>
        )}
        {solana.configMsg && (
          <>
            <Text size="base" className="text-primary-foreground">
              {t('signHotspot.direction')}
            </Text>
            <Text
              size="xl"
              className="mb-4 font-medium text-primary-foreground"
            >
              {`${heightFormat.format(
                METERS_TO_FEET * solana.configMsg.height,
              )}ft/${solana.configMsg.azimuth}° ${degToCompass(
                solana.configMsg.azimuth,
              )}`}
            </Text>
          </>
        )}
        <View className="flex-row">
          {locationData?.gain !== undefined && (
            <View className="me-12">
              <Text size="base" className="text-primary-foreground">
                {t('generic.gain')}:
              </Text>
              <Text
                size="xl"
                className="mb-4 font-medium text-primary-foreground"
              >
                {locationData.gain}
              </Text>
            </View>
          )}
          {locationData?.elevation !== undefined && (
            <View>
              <Text size="base" className="text-primary-foreground">
                {t('generic.elevation')}:
              </Text>
              <Text
                size="xl"
                className="mb-4 font-medium text-primary-foreground"
              >
                {locationData.elevation}
              </Text>
            </View>
          )}
        </View>
        {(solana.burnAmounts?.hntFee?.gt(new BN(0)) ||
          solana.burnAmounts?.dcFee?.gt(new BN(0))) && (
          <>
            <Text size="base" className="text-primary-foreground">
              {t('signHotspot.burnAmounts')}
            </Text>

            {solana.burnAmounts?.dcFee?.gt(new BN(0)) && (
              <Text
                size="xl"
                className="mb-4 font-medium text-primary-foreground"
              >
                {solana.burnAmounts?.dcFee?.toString()}
              </Text>
            )}

            {solana.burnAmounts?.hntFee?.gt(new BN(0)) && (
              <Text
                size="xl"
                className="mb-4 font-medium text-primary-foreground"
              >
                {solana.burnAmounts?.hntFee?.toString()}
              </Text>
            )}
          </>
        )}
        {!!transferData?.newOwner && (
          <>
            <Text size="base" className="text-primary-foreground">
              {t('signHotspot.newOwner')}
            </Text>
            <Text
              size="xl"
              className="mb-4 font-medium text-primary-foreground"
            >
              {transferData.newOwner}
            </Text>
          </>
        )}
        {!!parsedToken?.address && accounts?.[parsedToken.address] && (
          <>
            <Text size="base" className="text-primary-foreground">
              {t('signHotspot.owner')}
            </Text>
            <View className="mb-4 flex-row items-center">
              <AccountIcon size={20} address={parsedToken.address} />
              <Text
                size="xl"
                className="ml-2 flex-1 font-medium text-primary-foreground"
              >
                {formatAccountAlias(accounts[parsedToken.address])}
              </Text>
            </View>
          </>
        )}
        {!!gatewayAddress && (
          <>
            <Text size="base" className="text-primary-foreground">
              {t('generic.maker')}:
            </Text>
            <Text size="xl" className="font-medium text-primary-foreground">
              {onboardingRecord?.maker.name || 'Unknown'}
            </Text>
          </>
        )}
      </View>
      <View className="mt-6 flex-row gap-4">
        <Button
          variant="secondary"
          size="dashboard"
          className="flex-1"
          onPress={() => void handleCancel().catch(console.error)}
          disabled={submitLoading}
        >
          {t('generic.cancel')}
        </Button>
        <Button
          variant="cta"
          size="dashboard"
          className="flex-1"
          onPress={() => void handleLink().catch(console.error)}
          disabled={!validated || submitLoading || !solana.hasTransactions}
        >
          <Text className={buttonTextVariants({ variant: 'cta' })}>
            {t('generic.confirm')}
          </Text>
          {submitLoading && <Spinner colorClassName="accent-white" />}
        </Button>
      </View>
    </SafeArea>
  )
}

export default SignHotspot
