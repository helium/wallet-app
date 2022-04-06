import React, { useCallback, memo, useState, useMemo } from 'react'
import { ActivityIndicator, Image } from 'react-native'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { useTranslation } from 'react-i18next'
import { useAsync } from 'react-async-hook'
import Ledger from '@assets/images/ledger.svg'
import ArrowRight from '@assets/images/arrowRight.svg'
import Box from '../../components/Box'
import Text from '../../components/Text'
import Surface from '../../components/Surface'
import ButtonPressable from '../../components/ButtonPressable'
import {
  LedgerNavigatorNavigationProp,
  LedgerNavigatorStackParamList,
} from './ledgerNavigatorTypes'
import AccountIcon from '../../components/AccountIcon'
import { useAccountStorage } from '../../storage/AccountStorageProvider'
import { getLedgerAddress, useLedger } from '../../utils/heliumLedger'
import { useColors } from '../../theme/themeHooks'
import SafeAreaBox from '../../components/SafeAreaBox'

type Route = RouteProp<LedgerNavigatorStackParamList, 'DeviceShow'>
const DeviceShow = () => {
  const navigation = useNavigation<LedgerNavigatorNavigationProp>()
  const route = useRoute<Route>()
  const { ledgerDevice } = route.params
  const { t } = useTranslation()
  const { primaryText } = useColors()

  const { upsertAccount } = useAccountStorage()
  const { transport, getTransport } = useLedger()

  const [address, setAddress] = useState<string | undefined>()

  useAsync(async () => {
    try {
      const ledgerTransport = await getTransport(ledgerDevice.id)
      const addressB58 = await getLedgerAddress(ledgerTransport)
      setAddress(addressB58)
    } catch (error) {
      // in this case, user is likely not on Helium app
      console.error(error)
      navigation.navigate('DeviceScan', { error: error as Error })
    }
  }, [getTransport, ledgerDevice.id, navigation])

  const alias = useMemo(() => {
    if (!address) return ''
    return t('ledger.show.alias')
  }, [address, t])

  const next = useCallback(async () => {
    if (!address) return

    await upsertAccount({
      alias,
      address,
      ledgerDevice,
    })
    navigation.navigate('PairSuccess')
  }, [address, alias, ledgerDevice, navigation, upsertAccount])

  if (!transport || !address) {
    return (
      <Box
        flex={1}
        backgroundColor="primaryBackground"
        justifyContent="center"
        alignItems="center"
      >
        <ActivityIndicator />
      </Box>
    )
  }

  return (
    <SafeAreaBox
      flex={1}
      backgroundColor="primaryBackground"
      paddingHorizontal="l"
    >
      <Box flex={1} justifyContent="center">
        <Box>
          <Box
            marginBottom="xl"
            flexDirection="row"
            justifyContent="center"
            alignItems="center"
          >
            <Ledger width={62} height={62} color={primaryText} />
            <Box marginHorizontal="m">
              <ArrowRight />
            </Box>
            <Image source={require('@assets/images/fingerprintGreen.png')} />
          </Box>
          <Text variant="h1" textAlign="center">
            {t('ledger.show.title')}
          </Text>
          <Text
            variant="subtitle1"
            color="greenBright500"
            marginVertical="l"
            textAlign="center"
          >
            {t('ledger.show.subtitle')}
          </Text>
          <Surface flexDirection="row" alignItems="center" padding="l">
            <AccountIcon size={40} address={address} />
            <Box marginRight="l" marginLeft="l">
              <Text variant="subtitle2" marginBottom="xxs">
                {alias}
              </Text>
              <Text
                variant="body1"
                color="secondaryText"
                selectable
                numberOfLines={2}
                maxFontSizeMultiplier={1.2}
              >
                {address}
              </Text>
            </Box>
          </Surface>
          <Box marginTop="lm">
            <Text variant="subtitle4" color="error" textAlign="center">
              {t('ledger.show.help')}
            </Text>
          </Box>
        </Box>
      </Box>
      <ButtonPressable
        borderRadius="round"
        backgroundColor="blueBright500"
        backgroundColorOpacityPressed={0.8}
        onPress={next}
        title={t('ledger.show.next')}
        titleColor="black900"
        marginBottom="m"
      />
    </SafeAreaBox>
  )
}

export default memo(DeviceShow)
