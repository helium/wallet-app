import Box from '@components/Box'
import Text from '@components/Text'
import TextInput from '@components/TextInput'
import { BleError, useHotspotBle } from '@helium/react-native-sdk'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ScrollBox from '@components/ScrollBox'
import { useColors, useSpacing } from '@config/theme/themeHooks'
import { ViewStyle, StyleProp, KeyboardAvoidingView } from 'react-native'
import Visibility from '@assets/svgs/visibility.svg'
import VisibilityOff from '@assets/svgs/visibilityOff.svg'
import TouchableOpacityBox from '@components/TouchableOpacityBox'
import ImageBox from '@components/ImageBox'
import { Keypair } from '@solana/web3.js'
import animalName from 'angry-purple-tiger'
import Config from 'react-native-config'
import { useHotspotOnboarding } from '../../OnboardingSheet'
import CheckButton from '../../components/CheckButton'
import Loading from '../../components/Loading'

const MOCK = Config.MOCK_IOT === 'true'

const WifiSetup = () => {
  const [secureTextEntry, setSecureTextEntry] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const { setWifi, getOnboardingAddress } = useHotspotBle()
  const { t } = useTranslation()
  const spacing = useSpacing()
  const colors = useColors()
  const { carouselRef, setOnboardDetails } = useHotspotOnboarding()

  const {
    onboardDetails: {
      iotDetails: { network },
    },
  } = useHotspotOnboarding()

  const toggleSecureEntry = useCallback(() => {
    setSecureTextEntry(!secureTextEntry)
  }, [secureTextEntry])

  const handleSetWifi = useCallback(async () => {
    if (MOCK) {
      setLoading(true)

      // wait 2 seconds
      setTimeout(() => {
        setLoading(false)
      }, 2000)

      const onboardingAddress = Keypair.generate().publicKey.toBase58()
      setOnboardDetails((o) => ({
        ...o,
        iotDetails: { ...o.iotDetails, onboardingAddress },
      }))
      carouselRef?.current?.snapToNext()
      return
    }

    setLoading(true)
    try {
      await setWifi(network, password)
      const onboardingAddress = await getOnboardingAddress()
      setOnboardDetails((o) => ({
        ...o,
        iotDetails: {
          ...o.iotDetails,
          onboardingAddress,
          animalName: animalName(onboardingAddress),
        },
      }))
      carouselRef?.current?.snapToNext()
    } catch (e) {
      if (typeof e === 'string') {
        setError(e)
      } else {
        setError((e as BleError).toString())
      }
    }
    setLoading(false)
  }, [
    password,
    setWifi,
    network,
    carouselRef,
    getOnboardingAddress,
    setOnboardDetails,
  ])

  const contentContainer = useMemo(
    () => ({
      padding: spacing['2xl'],
      flex: 1,
      justifyContent: 'center',
    }),
    [spacing],
  )

  return (
    <ScrollBox contentContainerStyle={contentContainer as StyleProp<ViewStyle>}>
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <Box alignItems="center" marginBottom="2xl" paddingHorizontal="4xl">
          <ImageBox
            marginBottom="2xl"
            source={require('@assets/images/passwordIcon.png')}
          />
          <Text variant="displayMdSemibold" color="primaryText">
            {t('hotspotOnboarding.wifiSetup.title')}
          </Text>
          <Text
            variant="textLgRegular"
            color="text.quaternary-500"
            marginTop="2.5"
            textAlign="center"
          >
            {t('hotspotOnboarding.wifiSetup.subtitle', { network })}
          </Text>
          {error && (
            <Text variant="textSmRegular" color="error.500" marginTop="2.5">
              {error}
            </Text>
          )}
        </Box>
        <Box
          flexDirection="row"
          backgroundColor="cardBackground"
          borderRadius="2xl"
          paddingEnd="3xl"
          padding="2"
        >
          <TextInput
            variant="transparentSmall"
            flexGrow={1}
            textInputProps={{
              placeholder: t('hotspotOnboarding.wifiSetup.enterPassword'),
              autoCorrect: false,
              secureTextEntry,
              autoComplete: 'off',
              onChangeText: setPassword,
              value: password,
              autoFocus: false,
              keyboardAppearance: 'dark',
            }}
          />
          <TouchableOpacityBox
            onPress={toggleSecureEntry}
            justifyContent="center"
          >
            {secureTextEntry ? (
              <Visibility color={colors.primaryText} />
            ) : (
              <VisibilityOff color={colors.primaryText} />
            )}
          </TouchableOpacityBox>
        </Box>
      </KeyboardAvoidingView>
      {!loading && <CheckButton onPress={handleSetWifi} />}
      {loading && <Loading />}
    </ScrollBox>
  )
}

export default WifiSetup
